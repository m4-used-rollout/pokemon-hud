local getInputEndpoint = "http://127.0.0.1:5000/gbmode_input_request_bizhawk"
local doneInputEndpoint = "http://127.0.0.1:5000/gbmode_input_complete"
local hudEndpoint = "http://127.0.0.1:1337/"
local saveStateFolder = "D:\\runsaves\\" --must end in / (or \)

local inputEnabled = false
local saveStateEnabled = false
local updateRunStatus = true

local forceOptionsAnd = 0xFFFEFB
local forceOptionsOr  = 0x000200

if not http then
	local http = require("socket.http")
	http.TIMEOUT = 0.01
end
JSON = (loadfile "JSON.lua")()

--Permanent IWRAM addresses
clockAddr = 0x5CF8
musicAddr = 0x0F48

--Permanent EWRAM addresses
battlePartyOrder = 0x000070
battleFlagsAddress = 0x22FEC
battleParticipants = 0x24084
partyAddress = 0x244EC
enemyAddress = 0x24744
currentAreaAddress = 0x3732C
enemyTrainerAddress = 0x38BCA
secondTrainerAddress = 0x38BCC

--Pointers
gameDataPtr = 0x03005D8C -- Save Block 1
trainerDataPtr = 0x03005D90 -- Save Block 2
pcDataPtr = 0x03005D94
battlePartyOrderPtr = 0x03007551

-- Cmdr = (loadfile "Commander.lua")()
Utils = (loadfile "G3Utils.lua")()
Lookups = (loadfile "G3Lookups.lua")()

function WhereIsGameData()
	startAddr = Utils.switchDomainAndGetLocalPointer(memory.read_u32_le(Utils.switchDomainAndGetLocalPointer(gameDataPtr)))
	return string.format("Game Data (Save Block 1) starts at EWRAM %s", bizstring.hex(startAddr))
end
function WhereIsTrainerData()
	local startAddr = Utils.switchDomainAndGetLocalPointer(memory.read_u32_le(Utils.switchDomainAndGetLocalPointer(trainerDataPtr)))
	return string.format("Trainer Data (Save Block 2) starts at EWRAM %s", bizstring.hex(startAddr))
end

function getLocation()
    local data = {}
    local sBlock1Addr = Utils.switchDomainAndGetLocalPointer(memory.read_u32_le(Utils.switchDomainAndGetLocalPointer(gameDataPtr)))
    data["x"] = memory.read_u16_le(sBlock1Addr)
    data["y"] = memory.read_u16_le(sBlock1Addr + 2)
    data["map_bank"] = memory.readbyte(sBlock1Addr + 4)
    data["map_id"] = memory.readbyte(sBlock1Addr + 5)
    data["area_id"] = memory.readbyte(currentAreaAddress)
    return data
end

function getTrainerData()
	local data = getLocation()
    local sBlock2Addr = Utils.switchDomainAndGetLocalPointer(memory.read_u32_le(Utils.switchDomainAndGetLocalPointer(trainerDataPtr)))
	data["name"] = Utils.grabTextFromMemory(sBlock2Addr, 7)
	data["gender"] = Lookups.TrainerGender[memory.readbyte(sBlock2Addr + 8)]
	data["id"] = memory.read_u16_le(sBlock2Addr + 10)
	data["secret"] = memory.read_u16_le(sBlock2Addr + 12)
	data["options"] = Utils.getOptions(sBlock2Addr + 19)
	local securityKey = memory.read_u32_le(sBlock2Addr + 0xAC)
	local halfKey = securityKey % 0x10000
	data["security_key"] = securityKey
	data["caught_list"] = getDexFlagged(startAddr + 0x28, 49)
	data["seen_list"] = getDexFlagged(startAddr + 0x5C, 49)

	local sBlock1Addr = Utils.switchDomainAndGetLocalPointer(memory.read_u32_le(Utils.switchDomainAndGetLocalPointer(gameDataPtr)))	
	data["badges"] = getBadges(sBlock1Addr)
    -- data["level_cap"] = 250

	data["money"] = bit.bxor(securityKey, memory.read_u32_le(sBlock1Addr + 0x490))
	data["coins"] = bit.bxor(halfKey, memory.read_u16_le(sBlock1Addr + 0x494))

    data["items"] = {
		["pc"] = Utils.getItemCollection(startAddr + 0x498, 50) -- no key required
		["items"] = Utils.getItemCollection(startAddr + 0x560, 30, halfKey)
		["key"] = Utils.getItemCollection(startAddr + 0x5D8, 30, halfKey)
		["ball"] = Utils.getItemCollection(startAddr + 0x650, 16, halfKey)
		["tm"] = Utils.getItemCollection(startAddr + 0x690, 64, halfKey)
		["berry"] = Utils.getItemCollection(startAddr + 0x790, 46, halfKey)
    }
    -- Cmdr['DigestItems'](data["items"])

    data["daycare"] = {
        getPokemonData(sBlock1Addr + 0x3030),
        getPokemonData(sBlock1Addr + 0x3030 + 140)
    }

	local battleFlags = memory.read_u32_le(battleFlagsAddress)
	data["in_battle"] = bit.band(battleFlags, 4) > 0
	if data["in_battle"] then
		if bit.band(battleFlags, 8) > 0 then
            data["battle_kind"] = "Trainer"
			data["enemy_trainers"] = {
                { ["id"] = memory.read_u16_le(enemyTrainerAddress) },
			}
            if bit.band(battleFlags, 1) > 0 then
                table.insert( data["enemy_trainers"], { ["id"] = memory.read_u16_le(secondTrainerAddress) })
            end
        else
			data["battle_kind"] = "Wild"
			-- data["wild_species"] = getEnemyPokemon(1).species
		end
		data["enemy_party"] = getLimitedEnemyParty()
	else
		seenMons = {}
	end

	data["time"] = ReadRTC()

    local songId = memory.read_u16_le(musicAddr, 'IWRAM')
	data["evolution_is_happening"] = songId == 0x179

	return data
end

function InBattle()
	return bit.band(memory.read_u32_le(battleFlagsAddress, 'EWRAM'), 4) > 0
end

function InBattleFacility()
	return bit.band(memory.read_u32_le(battleFlagsAddress, 'EWRAM'), 0x100) > 0
end

local lastRTCUpdateTime = os.clock()
local lastSeenRTCSeconds = -1

function ReadRTC()
    memory.usememorydomain('IWRAM')
    local rtcCurrentSeconds =  memory.readbyte(clockAddr + 4)
	local rtcTotalSeconds = memory.read_s16_le(clockAddr) * 24 * 60 * 60 --days
	rtcTotalSeconds = rtcTotalSeconds + (memory.readbyte(clockAddr + 2) * 60 * 60) --hours
	rtcTotalSeconds = rtcTotalSeconds + (memory.readbyte(clockAddr + 3) * 60) -- minutes
	rtcTotalSeconds = rtcTotalSeconds + rtcCurrentSeconds --seconds

    if lastSeenRTCSeconds ~= rtcCurrentSeconds then
        lastRTCUpdateTime = os.clock()
        lastSeenRTCSeconds = rtcCurrentSeconds
    end

	local now = os.clock()
	if now > lastRTCUpdateTime then
		rtcTotalSeconds = rtcTotalSeconds + math.floor(now - lastRTCUpdateTime) --seconds since last update
	end

	return {
		["h"] = math.floor(rtcTotalSeconds / 60 / 60) % 24,
		["m"] = math.floor(rtcTotalSeconds / 60) % 60,
		-- ["s"] = rtcTotalSeconds % 60,
	}
end

function getBadges(startAddr)
	local flagStart = startAddr + 0x1270 --get start of saved flags
	return bit.rshift(memory.read_u16_le(flagStart + 0x10C), 7) % 256 --get just the badge flags
end

function getPartyPokemon(partySlot)
	if (partySlot == nil) then
		return { getPartyPokemon(1), getPartyPokemon(2), getPartyPokemon(3), getPartyPokemon(4), getPartyPokemon(5), getPartyPokemon(6) }
	end
	memory.usememorydomain("EWRAM")
	local offset = partyAddress + ((partySlot - 1) * 100)
	local data = getPokemonData(offset)
	if (data ~= nil) then
		getPartyOnlyData(data, offset + 80)
	end
	return data
end

function getEnemyPokemon(partySlot)
	if (partySlot == nil) then
		return { getEnemyPokemon(1), getEnemyPokemon(2), getEnemyPokemon(3), getEnemyPokemon(4), getEnemyPokemon(5), getEnemyPokemon(6) }
	end
	memory.usememorydomain("EWRAM")
	local offset = enemyAddress + ((partySlot - 1) * 100)
	local data = getPokemonData(offset)
	if (data ~= nil) then
		getPartyOnlyData(data, offset + 80)
	end
	return data
end

seenMons = {}
function getLimitedEnemyParty()
    local currentMons = getCurrentBattleParticipants() --updates seenMons as a side effect
    local party = getEnemyPokemon()
    for i = 1, 6 do
		if party[i] ~= nil then
            party[i]['active'] = currentMons[participantId(party[i])] ~= nil
            if seenMons[participantId(party[i])] == nil and party[i]['health'][1] > 0 then -- as yet unseen, censor species
				party[i]['species'] = {
					['id'] = 0,
					['name'] = '???'
				}
			end
			for k,v in pairs(party[i]) do -- remove extra information
				if k ~= "species" and k ~= "health" and k ~= "active" then
					party[i][k] = nil
				end
			end
		end
	end
    return party
end

function participantId(mon) -- some enemy trainers have personality value 0 for their entire party... hopefully this is enough to identify a pokemon
    return mon['personality_value'] .. mon['species']['id'] .. mon['original_trainer']['id'] .. mon['level'] .. mon['stats']['hp']
end

function getCurrentBattleParticipants(slot)
    if slot == nil then
		local currentMons = { getCurrentBattleParticipants(1), getCurrentBattleParticipants(2), getCurrentBattleParticipants(3), getCurrentBattleParticipants(4) }
        local outputMons = {}
        for i = 1, 4 do
            if currentMons[i] ~= nil then
                outputMons[participantId(currentMons[i])] = currentMons[i]
            end
        end
        return outputMons
	end
    memory.usememorydomain("EWRAM")
    local offset = battleParticipants + ((slot - 1) * 88)
    local ivs = memory.read_u32_le(offset + 20)
    local data = {
        ['species'] = {
            ['id'] = memory.read_u16_le(offset),
            ['type1'] = Lookups.Types[memory.readbyte(offset + 33)],
            ['type2'] = Lookups.Types[memory.readbyte(offset + 34)],
        },
        ['stats'] = {
            ['hp'] = memory.read_u16_le(offset + 44),
            ['attack'] = memory.read_u16_le(offset + 2),
            ['defense'] = memory.read_u16_le(offset + 4),
            ['speed'] = memory.read_u16_le(offset + 6),
            ['special_attack'] = memory.read_u16_le(offset + 8),
            ['special_defense'] = memory.read_u16_le(offset + 10)
        },
        ['moves'] = {
            buildMove(memory.read_u16_le(offset + 12), memory.readbyte(offset + 36)),
            buildMove(memory.read_u16_le(offset + 14), memory.readbyte(offset + 37)),
            buildMove(memory.read_u16_le(offset + 16), memory.readbyte(offset + 38)),
            buildMove(memory.read_u16_le(offset + 18), memory.readbyte(offset + 39))
        },
        ['ivs'] = {
            ['hp'] = ivs % 32,
            ['attack'] = bit.rshift(ivs, 5) % 32,
            ['defense'] = bit.rshift(ivs, 10) % 32,
            ['speed'] = bit.rshift(ivs, 15) % 32,
            ['special_attack'] = bit.rshift(ivs, 20) % 32,
            ['special_defense'] = bit.rshift(ivs, 25) % 32,
        },
        ['buffs'] = {
            ['hp'] = memory.readbyte(offset + 24),
            ['attack'] = memory.readbyte(offset + 25),
            ['defense'] = memory.readbyte(offset + 26),
            ['speed'] = memory.readbyte(offset + 27),
            ['special_attack'] = memory.readbyte(offset + 28),
            ['special_defense'] = memory.readbyte(offset + 29),
            ['accuracy'] = memory.readbyte(offset + 30),
            ['evasion'] = memory.readbyte(offset + 31)
        },
        ['ability'] = memory.readbyte(offset + 32),
        -- 1 byte padding
        ['health'] = {
            memory.read_u16_le(offset + 40),
            memory.read_u16_le(offset + 44)
        },
        ['level'] = memory.readbyte(offset + 42),
        ['friendship'] = memory.readbyte(offset + 43),
        ['held_item'] = {['id'] = memory.read_u16_le(offset + 46)},
        ['name'] = Utils.grabTextFromMemory(offset + 48, 12),
        ['original_trainer'] = {
            ['name'] = Utils.grabTextFromMemory(offset + 60, 8),
            ['id'] = memory.read_u16_le(offset + 84),
            ['secret'] = memory.read_u16_le(offset + 86)
        },
        -- 4 bytes padding
        ['personality_value'] = memory.read_u32_le(offset + 72),
        ['status'] = memory.read_u32_le(offset + 76),
        ['status2'] = memory.read_u32_le(offset + 80),
    }
    if data['species']['id'] > 0 then
        seenMons[participantId(data)] = data
        return data
    end
    return nil
end

function updatePartyDuringBattle(party)
    if InBattle() ~= true then
        return party
    end
	--party = putPartyInPartyMenuOrder(party)
    local currentMons = getCurrentBattleParticipants() 
    for i = 1, 6 do
		if party[i] ~= nil then
            party[i]['active'] = currentMons[participantId(party[i])] ~= nil
            if currentMons[participantId(party[i])] ~= nil then
				local pMon = party[i]
                local cMon = currentMons[participantId(pMon)]
                pMon['species'] = cMon['species']
                pMon['ability'] = cMon['ability']
                pMon['held_item'] = cMon['held_item']
                pMon['buffs'] = cMon['buffs']
			end
		end
	end
    return party
end

function getBattlePartyOrder()
	if InBattle() ~= true then
        return {0, 1, 2, 3, 4, 5}
    end
	local battleOrder = memory.read_u24_be(battlePartyOrder, 'EWRAM')
	if InBattleFacility() == true then
		battleOrder = memory.read_u24_be(battlePartyOrder + 3, 'EWRAM')
	end
	return { bit.rshift(battleOrder, 20), bit.rshift(battleOrder, 16) % 16, bit.rshift(battleOrder, 12) % 16, bit.rshift(battleOrder, 8) % 16, bit.rshift(battleOrder, 4) % 16, battleOrder % 16 }
end

function getPIDsInBattleOrder(originalParty)
	if originalParty == nil then
		originalParty = bankedBattleParty
	end
	local battleOrder = getBattlePartyOrder()
	local pidList = {}
	for i = 0, 5 do
		if originalParty[i + 1] then
			pidList[battleOrder[i + 1]] = originalParty[i + 1]['personality_value']
		end
	end
	return pidList
end

function makePartyPIDDict(party)
	local pDict = {}
	for i = 1, 6 do
		if party[i] ~= nil then
			pDict[party[i]["personality_value"]] = party[i]
		end
	end
	return pDict
end

bankedBattleParty = nil

function putPartyInPartyMenuOrder(party)
	if InBattle() ~= true then
		bankedBattleParty = nil
		return party
	end
	if bankedBattleParty == nil then
		bankedBattleParty = party
	end
	local pDict = makePartyPIDDict(party)
	local pList = {}
	local orderList = getPIDsInBattleOrder(bankedBattleParty)
	for i = 0, 5 do
		if pDict[orderList[i]] then
			table.insert(pList, pDict[orderList[i]])
		end
	end
	if #party > #pList then --we're missing some mons, so forget it.
		return party
	end
	return pList
end

function getCurrentPCBox(startAddr)
	if startAddr == nil then
		startAddr = switchDomainAndGetLocalPointer(memory.read_u32_le(switchDomainAndGetLocalPointer(pcDataPtr)))
	end
	return memory.read_u32_le(startAddr) + 1;
end

function getBoxedPokemon(boxNum)
    local startAddr = switchDomainAndGetLocalPointer(memory.read_u32_le(switchDomainAndGetLocalPointer(pcDataPtr)))
	if boxNum == nil then
		boxNum = getCurrentPCBox(startAddr)
	end
	return {
        ['current_box_number'] = getCurrentPCBox(startAddr),
        ['boxes'] = {
            {
                ['box_number'] = boxNum,
                ['box_name'] = getPCBoxName(startAddr, boxNum),
                ['box_contents'] = getEntirePCBox(startAddr, boxNum)
            }
        }
    }
end

function getEntirePCBox(pcStartAddr, boxNum) 
	local box = {}
	local boxStartAddr = pcStartAddr + 4 + ((boxNum - 1) * 80 * 30)
	for i = 1, 30 do
		local mon = getPokemonData(boxStartAddr + ((i - 1) * 80))
		if mon then
			mon['box_slot'] = i
			table.insert(box, mon)
		end
	end
	return box
end

function getPCBoxName(pcStartAddr, boxNum)
	return Utils.grabTextFromMemory(pcStartAddr + 0x8344 + ((boxNum - 1) * 9), 8)
end

function getPokemonData(startAddr)
	local data = {}
	local pv = memory.read_u32_le(startAddr);
	local ot = memory.read_u32_le(startAddr + 4)
	local key = bit.bxor(pv, ot)
	if (key == 0) then --no pokemon found
		return nil
	end
	-- data['address'] = bizstring.hex(startAddr) --for debugging
	data["personality_value"] = pv
	data["original_trainer"] = {
        ["id"] = ot % 65536,
        ["secret"] = bit.rshift(ot, 16)
    }
	data["name"] = Utils.grabTextFromMemory(startAddr + 8, 10)
	data["language"] = memory.read_u16_le(startAddr + 18)
	data["original_trainer"]["name"] = Utils.grabTextFromMemory(startAddr + 20, 7)
	data["marking"] = getMarkingString(startAddr + 27)
	local checkSum = memory.read_u16_le(startAddr + 28)
    pcall(function ()
		parseDataSubstructure(data, descrambleDataSubstructure(decryptDataSubstructure(startAddr + 32, key, checkSum), pv))
    end)
	return data
end

function getPartyOnlyData(data, startAddr)
	data["status"] = memory.read_u32_le(startAddr)
	data["level"] = memory.readbyte(startAddr + 4)
	data["pokerus_remaining"] = memory.readbyte(startAddr + 5)
	local hp_current = memory.read_u16_le(startAddr + 6)
	local hp_total = memory.read_u16_le(startAddr + 8)
	data["health"] = { hp_current, hp_total }
	data["stats"] = {
		["hp"] = hp_total,
		["attack"] = memory.read_u16_le(startAddr + 10),
		["defense"] = memory.read_u16_le(startAddr + 12),
		["speed"] = memory.read_u16_le(startAddr + 14),
		["special_attack"] = memory.read_u16_le(startAddr + 16),
		["special_defense"] = memory.read_u16_le(startAddr + 18)
	}
end

function parseDataSubstructure(data, subStructure)
	if (subStructure == nil) then
		return nil
	end
	--Growth
	data["species"] = { ["id"] = get16(subStructure["G"], 0) }
	data["held_item"] = { ["id"] = get16(subStructure["G"], 2) }
	data["experience"] = {["current"] = get32(subStructure["G"], 4)}
	local ppUps = subStructure["G"][8]
	data["friendship"] = subStructure["G"][9]

	--Attacks
	data["moves"] = {
		buildMove(get16(subStructure["A"], 0), subStructure["A"][8], ppUps % 4),
		buildMove(get16(subStructure["A"], 2), subStructure["A"][9], bit.rshift(ppUps, 2) % 4),
		buildMove(get16(subStructure["A"], 4), subStructure["A"][10], bit.rshift(ppUps, 4) % 4),
		buildMove(get16(subStructure["A"], 6), subStructure["A"][11], bit.rshift(ppUps, 6)),
	}

	--EVs & Condition
	data['evs'] = {
		["hp"] = subStructure["E"][0],
		["attack"] = subStructure["E"][1],
		["defense"] = subStructure["E"][2],
		["speed"] = subStructure["E"][3],
		["special_attack"] = subStructure["E"][4],
		["special_defense"] = subStructure["E"][5],
	}
	data['condition'] = {
		["coolness"] = subStructure["E"][6],
		["beauty"] = subStructure["E"][7],
		["cuteness"] = subStructure["E"][8],
		["smartness"] = subStructure["E"][9],
		["toughness"] = subStructure["E"][10],
		["feel"] = subStructure["E"][11]
	}

	--Miscellaneous
	local pokerus = subStructure["M"][0]
	data['pokerus'] = {
		['infected'] = pokerus > 0,
		['days_left'] = pokerus % 16,
		['strain'] = bit.rshift(pokerus, 4),
		['cured'] = ((pokerus > 0) and (pokerus % 16 == 0))
	}
	local origins = get16(subStructure["M"], 2)
	data['met'] = {
		['map_id'] = subStructure["M"][1],
		['level'] = origins % 128,
		['game'] = Lookups.OriginalGame[bit.rshift(origins, 7) % 16],
		['caught_in'] = bit.rshift(origins, 11) % 16
	}
	data['original_trainer']['gender'] = Lookups.TrainerGender[bit.rshift(origins, 15)]
	local ivs = get32(subStructure["M"], 4)
	data['ivs'] = {
		['hp'] = ivs % 32,
		['attack'] = bit.rshift(ivs, 5) % 32,
		['defense'] = bit.rshift(ivs, 10) % 32,
		['speed'] = bit.rshift(ivs, 15) % 32,
		['special_attack'] = bit.rshift(ivs, 20) % 32,
		['special_defense'] = bit.rshift(ivs, 25) % 32,
	}
	data["is_egg"] = bit.rshift(ivs, 30) % 2 > 0
	data["ability"] = bit.rshift(ivs, 31) % 2
	local ribbons = get32(subStructure["M"], 8)
	data["ribbons"] = {}
	addRibbon(data, ribbons % 8, "Cool")
	addRibbon(data, bit.rshift(ribbons, 3) % 8, "Beauty")
	addRibbon(data, bit.rshift(ribbons, 6) % 8, "Cute")
	addRibbon(data, bit.rshift(ribbons, 9) % 8, "Smart")
	addRibbon(data, bit.rshift(ribbons, 12) % 8, "Tough")
	addRibbon(data, bit.rshift(ribbons, 15) % 2, "Champion")
	addRibbon(data, bit.rshift(ribbons, 16) % 2, "Winning")
	addRibbon(data, bit.rshift(ribbons, 17) % 2, "Victory")
	addRibbon(data, bit.rshift(ribbons, 18) % 2, "Artist")
	addRibbon(data, bit.rshift(ribbons, 19) % 2, "Effort")
	--Ribbons 20-26 are rare and not well documented
end

function get16(byteTable, offset) 
	return bit.lshift(byteTable[offset + 1], 8) + byteTable[offset]
end

function get32(byteTable, offset) 
	return bit.lshift(get16(byteTable, offset + 2), 16) + get16(byteTable, offset)
end

function addRibbon(data, value, ribbonName)
	if (value > 1) then
		ribbonName = ribbonName .. ' ' .. ContestRank[value]
	end
	if (value > 0) then
		table.insert(data["ribbons"], ribbonName)
	end
end

ContestRank = {
	[2] = "Super",
	[3] = "Hyper",
	[4] = "Master"
}

function getMarkingString(addr)
	local marks = memory.readbyte(addr)
	local marking = ''
	for i = 0, 3 do
		if bit.band(marks, bit.lshift(1, i)) > 0 then
			marking = marking .. Markings[i]
		end
	end
	return marking
end

--Pokemon Storage markings to UTF-8
Markings = {
	[0] = string.char(0xE2,0x97,0x8F), -- ●
	[1] = string.char(0xE2,0x96,0xA0), -- ■
	[2] = string.char(0xE2,0x96,0xB2), -- ▲
	[3] = string.char(0xE2,0x99,0xA5)  -- ♥
}

function buildMove(moveId, pp, ppUp) 
	if moveId == 0 then
		return nil
	end
	return {
		["id"] = moveId,
		["pp"] = pp,
		["pp_up"] = ppUp
	}
end

function MemoryMangling()
	--Force options values
	if forceOptionsAnd ~= 0xFF or forceOptionsOr ~= 0x00 then
        local optionsAddr = Utils.switchDomainAndGetLocalPointer(memory.read_u32_le(Utils.switchDomainAndGetLocalPointer(trainerDataPtr))) + 19
        local options = memory.read_u24_be(optionsAddr, 'EWRAM')
		options = bit.band(options, forceOptionsAnd)
        options = bit.bor(options, forceOptionsOr)
        memory.write_u24_be(optionsAddr, options, 'EWRAM')
	end
end

function encodeTrainer()
	return JSON:encode(getTrainerData())
end
function encodeParty()
	return JSON:encode(updatePartyDuringBattle(getPartyPokemon()))
end
function encodePCBox(boxNum)
	return JSON:encode(getBoxedPokemon(boxNum))
end


local lastSaveStateLocation = 0
function saveState(frames)
	if frames == nil or (frames % 18000 == 1 and saveStateEnabled) then --every 5 minutes
		local time = os.date("*t")
        local location = getLocation()
		local path = string.format("%s/%04d-%02d-%02dT%02d-%02d-%02dZ.%02d-%02d-%02d-%02d.%s.State", saveStateFolder, time['year'], time['month'], time['day'], time['hour'], time['min'], time['sec'], location['map_bank'], location['map_id'], location['x'], location['y'], gameinfo.getromname())
		savestate.save(path)
	end
    if frames == nil or (frames % 3600 == 18 and saveStateEnabled) then --every minute check if map changed
        local location = getLocation()
        local mapId = bit.lshift(location['map_bank'], 8) + location['map_id']
        if mapId ~= lastSaveStateLocation then
            savestate.saveslot(0)
            lastSaveStateLocation = mapId
        end
    end
end

function panicRestore()
    savestate.loadslot(0)
end

local frozen = 0
function CanUpdateRunStatus()
	if updateRunStatus and (frozen == 0 or os.clock() - frozen > 5) then
		frozen = 0
		return true
	end
	return false
end

function sendParty()
	if CanUpdateRunStatus() then
		http.request(hudEndpoint, encodeParty())
	end
end

function sendTrainer()
	if CanUpdateRunStatus() then
		http.request(hudEndpoint, encodeTrainer())
	end
end

function sendPC(boxNum)
	if CanUpdateRunStatus() then
		http.request(hudEndpoint, encodePCBox(boxNum))
	end
end


local onlyAAllowed = false
local currentInput = {}
local currentSeries = {}
function fetchInput()
	if inputEnabled ~= true then
		return
	end

	if currentInput['active'] ~= true then --We don't have an input.
		if table.getn(currentSeries) > 0 then --get next input from series
			currentInput = table.remove(currentSeries, 1)
			currentInput['active'] = true
			currentInput["Held_Frames"] = math.ceil(currentInput["Held_Frames"])
			currentInput["Sleep_Frames"] = math.ceil(currentInput["Sleep_Frames"])
		else --Check the core
			local response = http.request(getInputEndpoint)
			if response ~= nil and response ~= "Unable to connect to the remote server" then			
                currentInput = JSON:decode(response)
				--print(response)
                currentInput['active'] = true
                if currentInput["Series"] ~= nil then
                    currentSeries = currentInput["Series"]
                    currentInput = {}
                    return fetchInput()
				else
					currentInput["Held_Frames"] = math.ceil(currentInput["Held_Frames"])
					currentInput["Sleep_Frames"] = math.ceil(currentInput["Sleep_Frames"])
					if currentInput["Hold"] == true then
						currentInput["Hold"] = false
						local shiftFrames = 24 - currentInput["Held_Frames"]
						currentInput["Held_Frames"] = currentInput["Held_Frames"] + shiftFrames
						currentInput["Sleep_Frames"] = currentInput["Sleep_Frames"] - shiftFrames
						if currentInput["Sleep_Frames"] < 0 then
							currentInput["Held_Frames"] = currentInput["Held_Frames"] + currentInput["Sleep_Frames"]
						end
					end
                end
            end
		end
	end

    -- if currentInput["Battle_Command"] ~= nil then
    --     local cmd = Cmdr['Parse'](currentInput["Battle_Command"])
	-- 	local inputCount = 0
	-- 	for k,v in pairs(cmd) do
	-- 		inputCount = inputCount + 1
	-- 	end
	-- 	if inputCount > 0 then
	-- 		cmd["Held_Frames"] = currentInput["Held_Frames"]
	-- 		cmd["Sleep_Frames"] = currentInput["Sleep_Frames"]
	-- 		cmd["active"] = currentInput["active"]
	-- 		currentInput = cmd
	-- 	end
    --     currentInput["Battle_Command"] = nil
    -- end

    if currentInput["Admin_Command"] == "Panic Restore" then
        panicRestore()
        currentInput = { ["active"] = true }
    end

	local input = currentInput
	if currentInput["Held_Frames"] ~= nil and currentInput["Held_Frames"] > 0 then --time of press
		currentInput["Held_Frames"] = currentInput["Held_Frames"] - 1
	elseif currentInput["Sleep_Frames"] ~= nil and currentInput["Sleep_Frames"] > 0 then --time between presses
		currentInput["Sleep_Frames"] = currentInput["Sleep_Frames"] - 1
		if currentInput["Hold"] ~= true then
		    input = {}
		end
	elseif currentInput['active'] then
        if currentInput["Hold"] ~= true and currentInput["Sleep_Frames"] == 0 then --if sleep frames are negative this was a held input
    		input = {}
            currentInput = {}
        else
            currentInput['active'] = false
        end
		if table.getn(currentSeries) < 1 then
			http.request(doneInputEndpoint)
		end
	elseif currentInput['active'] == false then
		if currentInput["expired"] == nil then
			currentInput["expired"] = 1
		elseif currentInput["expired"] > 10 then --even if held, shred input after 10 frames of not recieving a new input
			currentInput = {}
		else
			currentInput["expired"] = currentInput["expired"] + 1
		end
	end

	if onlyAAllowed then
		local filteredInput = {}
		filteredInput['A'] = input['A']
		input = filteredInput
	end

	joypad.set(input)
end


local boxNum = 1

function sendData(frame)
	--Sends a single PC box once every 30 seconds
	--Sends the current PC box once per second
	--Sends the current Trainer data 2 times per second (every 20 frames, unless sending PC data)
	--Sends the current Party 3 times per second (every 10 frames, unless sending PC or Trainer data)

	MemoryMangling()

	if frame and frame % 180 == 0 then --once every 3 seconds
		sendPC(boxNum)
		boxNum = (boxNum % 14) + 1
	elseif frame and frame % 60 == 0 then --once every second
		sendPC()
	elseif frame % 20 == 0 then --once every 20 frames
		sendTrainer()
	elseif frame % 10 == 0 then --once every 10 frames
		sendParty()
	end
end

while true do
	emu.frameadvance()
	sendData(emu.framecount())
	saveState(emu.framecount())
	pcall(fetchInput)
end