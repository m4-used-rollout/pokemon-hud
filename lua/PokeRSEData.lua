--This library adds RSE/FRLG game data reading functions to memory. Use with PokeRunStatus.lua.

function initEmerald()
	-- print("Emerald-based game detected")
	--permanent memory addresses
	partyAddress = 0x244EC
	enemyAddress = 0x24744
	currentAreaAddress = 0x03732C

	--pointers to other data
	gameDataPtr = 0x03005D8C
	trainerDataPtr = 0x03005D90
	pcDataPtr = 0x03005D94
	
	--ROM info
	romAddresses = {
		['tmData'] = 0x616040,
		['numTMs'] = 50,
		['itemData'] = 0x5839A0,
		['attackNames'] = 0x31977C,
		['attackData'] = 0x31C898,
		['pokemonNames'] = 0x3185C8,
		['nationalDexTable'] = 0x31DC82,
		['numberOfPokemon'] = 412,
		['regionalToNationalDex'] = 0x31DFB8,
		['pokemonData'] = 0x3203CC,
		['abilityNames'] = 0x31B6DB,
		['mapLabelData'] = 0x5A1480,
		['mapDataSize'] = 8,
		['natures'] = 0x61CAAC
	}
end

-- function initFireRed()
-- 	print("FireRed-based game detected")
-- 	partyAddress = 0x24284
-- 	enemyAddress = 0x2402C

-- 	--FireRed can only get pokemon data for now, trainer data is coming later on

-- 	romAddresses = {
-- 		['tmData'] = 0x45A80C,
-- 		['numTMs'] = 50,
-- 		['itemData'] = 0x3DB028,
-- 		['attackNames'] = 0x247094,
-- 		['attackData'] = 0x250C04,
-- 		['pokemonNames'] = 0x245EE0,
-- 		['nationalDexTable'] = 0x251FEE,
-- 		['numberOfPokemon'] = 412,
-- 		['pokemonData'] = 0x254784,
-- 		['abilityNames'] = 0x24FC40,
-- 		['mapLabelData'] = 0x3F1CAC,
-- 		['mapDataSize'] = 4,
-- 		['natures'] = 0x463DBC
-- 	}
-- end

-- function init()
-- 	local game = bizstring.tolower(gameinfo.getromname())
-- 	if string.find(game, 'emerald') ~= nil or string.find(game,'glazed') ~= nil then
-- 		return initEmerald()
-- 	end
-- 	if string.find(game, 'firered') ~= nil or string.find(game, 'ash gray') ~= nil then
-- 		return initFireRed()
-- 	end
-- end

while emu.framecount() == 0 do
	emu.frameadvance() --do nothing until emulator runs
end

initEmerald()


-- BizHawk uses 24-bit memory addresses and splits the memory up into 'domains'
MemSwitch = { [0x00] = "BIOS", [0x02] = "EWRAM", [0x03] = "IWRAM", [0x05] = "PALRAM", [0x06] = "VRAM", [0x07] = "OAM", [0x08] = "ROM" }
function switchDomainAndGetLocalPointer(globalPtr)
	memory.usememorydomain(MemSwitch[bit.rshift(globalPtr, 24)])
	return globalPtr % 0x1000000
end

function WhereIsTrainerData() 
	local startAddr = switchDomainAndGetLocalPointer(memory.read_u32_le(switchDomainAndGetLocalPointer(trainerDataPtr)))
	return string.format("Trainer Data starts at %s", bizstring.hex(startAddr))
end
function WhereIsGameData()
	startAddr = switchDomainAndGetLocalPointer(memory.read_u32_le(switchDomainAndGetLocalPointer(gameDataPtr)))
	return string.format("Game Data starts at %s", bizstring.hex(startAddr))
end

function getTrainerData()
	local startAddr = switchDomainAndGetLocalPointer(memory.read_u32_le(switchDomainAndGetLocalPointer(trainerDataPtr)))
	local data = {}
	data["name"] = grabTextFromMemory(startAddr, 7)
	data["gender"] = TrainerGender[memory.readbyte(startAddr + 8)]
	local trainerId = memory.read_u32_le(startAddr + 10)
	data["id"] = trainerId % 65536
	data["secret"] = math.floor(trainerId / 65536)
	--data["time_played"] = string.format('%d:%d:%d.%d', memory.read_u16_le(startAddr + 14), memory.readbyte(startAddr + 16), memory.readbyte(startAddr + 17), memory.readbyte(startAddr + 18))
	data["options"] = getOptions(startAddr + 19)
	local securityKey = memory.read_u32_le(startAddr + 0xAC)
	local halfKey = securityKey % 0x10000
	data["security_key"] = securityKey
	data["caught"] = getDexCount(startAddr + 0x28, 49)
	data["seen"] = getDexCount(startAddr + 0x5C, 49)
	data["caught_list"] = getDexFlagged(startAddr + 0x28, 49)
	data["seen_list"] = getDexFlagged(startAddr + 0x5C, 49)

	startAddr = switchDomainAndGetLocalPointer(memory.read_u32_le(switchDomainAndGetLocalPointer(gameDataPtr)))
	data["x"] = memory.read_u16_le(startAddr)
	data["y"] = memory.read_u16_le(startAddr + 2)
	data["map_bank"] = memory.readbyte(startAddr + 4)
	data["map_id"] = memory.readbyte(startAddr + 5)
	local area = memory.readbyte(currentAreaAddress)
	data["area_id"] = area
	
	--Tunod/Johto badges
	data["badges"] = bit.bor(bit.lshift(getMoreBadges(startAddr), 8), getBadges(startAddr))

	data["money"] = bit.bxor(securityKey, memory.read_u32_le(startAddr + 0x490))
	data["coins"] = bit.bxor(halfKey, memory.read_u16_le(startAddr + 0x494))
	data["pc_items"] = getItemCollection(startAddr + 0x498, 50) -- no key required
	data["items"] = getItemCollection(startAddr + 0x560, 30, halfKey)
	data["items_key"] = getItemCollection(startAddr + 0x5D8, 30, halfKey)
	data["items_ball"] = getItemCollection(startAddr + 0x650, 16, halfKey)
	data["items_tm"] = getItemCollection(startAddr + 0x690, 64, halfKey)
	data["items_berry"] = getItemCollection(startAddr + 0x790, 46, halfKey)

	--ROM data
	memory.usememorydomain("ROM")
	data["area_name"] = getMapName(area)
	augmentItemCollection(data["pc_items"])
	augmentItemCollection(data["items"])
	augmentItemCollection(data["items_key"])
	augmentItemCollection(data["items_ball"])
	augmentItemCollection(data["items_tm"])
	augmentItemCollection(data["items_berry"])
	return data
end

function getOptions(startAddr)
	local options = {}
	local firstByte = memory.readbyte(startAddr)
	if firstByte == 0 then
		options["button_mode"] = "Normal"
	elseif firstByte == 1 then
		options["button_mode"] = "LR"
	elseif firstByte == 2 then
		options["button_mode"] = "L=A"
	end
	local secondByte = memory.readbyte(startAddr + 1)
	options["frame"] = "Type" .. (bit.rshift(secondByte, 3) + 1)
	secondByte = secondByte % 4
	if secondByte == 2 then
		options["text_speed"] = "Fast"
	elseif secondByte == 1 then
		options["text_speed"] = "Med"
	else
		options["text_speed"] = "Slow"
	end
	local thirdByte = memory.readbyte(startAddr + 2)
	if thirdByte % 2 > 0 then
		options["sound"] = "Stereo"
	else
		options["sound"] = "Mono"
	end
	if bit.band(thirdByte, 2) > 0 then
		options["battle_style"] = "Set"
	else
		options["battle_style"] = "Switch"
	end
	if bit.band(thirdByte, 4) > 0 then
		options["battle_scene"] = "Off"
	else
		options["battle_scene"] = "On"
	end
	return options
end

function getBadges(startAddr)
	local flagStart = startAddr + 0x1270
	return bit.rshift(memory.read_u16_le(flagStart + 0x10C), 7) % 256
end

function getMoreBadges(startAddr)
	local flagStart = startAddr + 0x1270
	local frontierBrains = bit.rshift(memory.read_u24_le(flagStart + 0x118), 4) % 0x4000
	--if we wanted the battle frontier badges from Emerald, we'd be done here.
	--they're 14 bits long, two bits per badge. 3 = gold badge, 1 or 2 = silver badge.
	--Glazed uses these for johto badges, and gold means the 8th badge, so we're changing it.
	local badges = 0
	local lastBadge = 0;
	for i = 0, 6 do
		local pair = bit.rshift(frontierBrains, i * 2) % 4
		if pair > 0 then
			badges = bit.bor(badges, bit.lshift(1, i))
		end
		if pair == 3 then
			lastBadge = bit.bor(lastBadge, 1)
		end
	end
	return bit.bor(badges, bit.lshift(lastBadge, 7))
end


function getItemCollection(startAddr, length, key)
	if not key then
		key = 0
	end
	local list = {}
	for i=0,length - 1 do
		local id = memory.read_u16_le(startAddr + (4 * i))
		if id > 0 then
			table.insert(list, {
				["id"] = id,
				["count"] = bit.bxor(key, memory.read_u16_le(startAddr + (4 * i) + 2))
			})
		end
	end
	return list
end

function augmentItemCollection(items)
	for index,item in ipairs(items) do
		items[index] = getItemData(item['id'], item['count'])
	end
	return items
end

function getDexCount(startAddr, lenBytes)
	local count = 0
	for i = 0, lenBytes - 1 do
		local byte = memory.readbyte(startAddr + i)
		while byte > 0 do
			count = count + (byte % 2)
			byte = bit.rshift(byte, 1)
		end
	end
	return count
end

function getDexFlagged(startAddr, lenBytes)
	local dex = {}
	for i = 0, lenBytes - 1 do
		local byte = memory.readbyte(startAddr + i)
		for b = 0, 7 do
			if bit.band(byte, bit.lshift(1, b)) ~= 0 then
				table.insert(dex, i * 8 + b + 1)
			end
		end
	end
	return dex
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
	return augmentPokemonFromRom(data)
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
	return augmentPokemonFromRom(data)
end

function getCurrentPCBox(startAddr)
	if startAddr == nil then
		startAddr = switchDomainAndGetLocalPointer(memory.read_u32_le(switchDomainAndGetLocalPointer(pcDataPtr)))
	end
	return memory.read_u32_le(startAddr) + 1;
end

function getBoxedPokemon(boxNum)
	local boxMin = 1
	local boxMax = 14
	if boxNum ~= nil then
		boxMin = boxNum
		boxMax = boxNum
	end
	local startAddr = switchDomainAndGetLocalPointer(memory.read_u32_le(switchDomainAndGetLocalPointer(pcDataPtr)))
	local data = {}
	data['current_box_number'] = getCurrentPCBox(startAddr)
	data['boxes'] = {}
	for box = boxMin, boxMax do
		table.insert(data['boxes'], {
			['box_number'] = box,
			['box_name'] = getPCBoxName(startAddr, box),
			['box_contents'] = getEntirePCBox(startAddr, box)
		})
	end

	-- gather ROM data
	for num,box in pairs(data['boxes']) do
		if box ~= nil then
			for mon = 1, 30 do
				augmentPokemonFromRom(box['box_contents'][mon])
			end
		end
	end

	return data
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
	return grabTextFromMemory(pcStartAddr + 0x8344 + ((boxNum - 1) * 9), 8)
end

function getPokemonData(startAddr)
	local data = {}
	local pv = memory.read_u32_le(startAddr);
	local ot = memory.read_u32_le(startAddr + 4)
	local key = bit.bxor(pv, ot)
	if (key == 0) then --data must not contain pokemon
		return nil
	end
	-- data['address'] = bizstring.hex(startAddr) --for debugging
	data["personality_value"] = pv
	data["original_trainer"] = {}
	pullDataFromPersonalityAndTrainer(data, pv, ot)
	data["name"] = grabTextFromMemory(startAddr + 8, 10)
	data["language"] = memory.read_u16_le(startAddr + 18)
	data["original_trainer"]["name"] = grabTextFromMemory(startAddr + 20, 7)
	data["marking"] = getMarkingString(startAddr + 27)
	local checkSum = memory.read_u16_le(startAddr + 28)
	parseDataSubstructure(data, descrambleDataSubstructure(decryptDataSubstructure(startAddr + 32, key, checkSum), pv))
	return data
end

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

function pullDataFromPersonalityAndTrainer(data, pv, ot)
	local otId = ot % 65536
	local otSecret = math.floor(ot / 65536)
	data["gender"] = pv % 256 -- check against species gender ratio. >= is male, < is female
	data["ability"] = pv % 2 -- 0 is Ability 1, 1 is Ability 2
	data["nature"] = Natures[pv % 25]
	data["original_trainer"]["id"] = otId
	data["original_trainer"]["secret"] = otSecret
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
		['game'] = OriginalGame[bit.rshift(origins, 7) % 16],
		['caught_in'] = bit.rshift(origins, 11) % 16
	}
	data['original_trainer']['gender'] = TrainerGender[bit.rshift(origins, 15)]
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
	--20-26 are special badge slots that have vaguely-defined meaning and we probably won't get them anyway
end

function addRibbon(data, value, ribbonName)
	if (value > 1) then
		ribbonName = ribbonName .. ' ' .. ContestRank[value]
	end
	if (value > 0) then
		table.insert(data["ribbons"], ribbonName)
	end
end

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

function decryptDataSubstructure(startAddr, key, checkSum)
	local decryptedData = {}
    for i=0,11 do
        local dword = bit.bxor(memory.read_u32_le(startAddr + i * 4),key) 
        for j=0,3 do
            table.insert(decryptedData, bit.band(bit.rshift(dword, (j * 8)), 0xFF))
        end
    end
    local sum = 0
    for i=1,24 do
        sum = (sum + (bit.lshift(decryptedData[i * 2], 8) + decryptedData[i * 2 - 1])) % 65536
    end
    if (sum == checkSum) then
		return decryptedData
	end
	--  print(string.format("Error decoding Pokemon data: Calculated sum = %d, Read checksum = %d", sum, checkSum)) 
	return nil
end

function descrambleDataSubstructure(scrambledData, pv)
	if (scrambledData == nil) then
		return nil
	end
	local map = DataOrder[pv % 24]
	local descrambled = {}
	for i=0,3 do
		local mapChar = map:sub(i+1, i+1)
		descrambled[mapChar] = {}
		for j=0,11 do
			descrambled[mapChar][j] = scrambledData[(12 * i) + j + 1]
		end
	end
	return descrambled
end

function get16(byteTable, offset) 
	return bit.lshift(byteTable[offset + 1], 8) + byteTable[offset]
end

function get32(byteTable, offset) 
	return bit.lshift(get16(byteTable, offset + 2), 16) + get16(byteTable, offset)
end

function grabTextFromMemory(startAddr, length)
	if startAddr + length > memory.getmemorydomainsize() then --prevent overreads
		return bizstring.hex(startAddr)
	end
	local strBytes = memory.readbyterange(startAddr, length)
	local str = ""
	for i=0,length do
		if (strBytes[i]) then
			str = str .. string.char(strBytes[i])
		end
	end
	return translateRSEChars(str)
end

-- example: translateRSEChars(string.char(199, 0, 174, 174, 174, 186, 180, 186, 180, 165, 187, 255))
-- Pokémon's name is "M ---/’/’4"
-- BizHawk's console prints "M ---/â€™/â€™4"
-- BizHawk's console doesn't understand UTF-8, but the HUD does, so it comes out ok.
function translateRSEChars(rawStr)
	local outStr = ""
	for i=0,string.len(rawStr)-1 do
		local byte = string.byte(rawStr,i+1)
		if (byte >= 0xFA) then
			return outStr
		end
		outStr = outStr .. RSECharmap[byte]
	end
	return outStr
end

--fetch ROM data
function augmentPokemonFromRom(data)
	if (data == nil) then
		return data
	end
	memory.usememorydomain("ROM")
	if data["species"] then
		local id = data["species"]["id"]
		data["species"]["name"] = getSpeciesName(id)
		data["species"]["national_dex"] = getNatDexNumber(id)
		local info = getSpeciesData(id)
		data["species"]["type1"] = info["type1"]
		data["species"]["type2"] = info["type2"]
		data["species"]["egg_type1"] = info["egg_type1"]
		data["species"]["egg_type2"] = info["egg_type2"]
		data["species"]["growth_rate"] = info["growth_rate"]
		data["species"]["egg_cycles"] = info["egg_cycles"]
		if data["ability"] == 1 then
			data["ability"] = info["ability2"]
		else
			data["ability"] = info["ability1"]
		end
		if info['gender_ratio'] == 255 then
			data["gender"] = ""
		elseif info['gender_ratio'] == 254 or data["gender"] < info['gender_ratio'] then
			data["gender"] = "Female"
		else
			data["gender"] = "Male"
		end
		if data["experience"] then
			if not data["level"] then
				data['level'] = findLevelFromExp(info['growth_rate'], data['experience']['current'])
			end
			data["experience"]["this_level"] = math.floor(calculateExpForLevel[info["growth_rate"]](data["level"]))
			if data["level"] == 100 or data["level"] == 0 or data["level"] == nil then
				data["experience"]["next_level"] = 0
				data["experience"]["remaining"] = 0
			else
				data["experience"]["next_level"] = math.floor(calculateExpForLevel[info["growth_rate"]](data["level"] + 1))
				data["experience"]["remaining"] = data["experience"]["next_level"] - data["experience"]["current"]
			end
		end
	end
	if data["held_item"] then
		data["held_item"] = getItemData(data["held_item"]["id"])
	end
	if data["met"] and data["met"]["caught_in"] then
		data["met"]["caught_in"] = getItemName(data["met"]["caught_in"])
		data["met"]["map_name"] = getMapName(data["met"]["map_id"])
	end
	if data['moves'] then
		for i,move in ipairs(data['moves']) do
			move['name'] = getAttackName(move['id'])
			local info = getMoveData(move['id'])
			move['accuracy'] = info['accuracy']
			move['type'] = info['type']
			move['base_power'] = info['base_power']
			move['max_pp'] = info['pp']
			for i=1,move['pp_up'] do
				move['max_pp'] = move['max_pp'] + math.floor(info['pp'] * .2)
			end
		end
	end
	return data
end

function getItemData(id, count)
	if not count then
		count = 1
	end
	local info = {
		["id"] = id
	}
	if id == 0 then
		info["name"] = "None"
		info["count"] = 0
		info["key_item"] = 1 > 0
	else
		info["name"] = getItemName(id)
		info["count"] = count
		info["key_item"] = itemIsKeyItem(id)
	end
	return info
end

function getSpeciesData(index)
	local startAddr = romAddresses["pokemonData"] + (28 * index)
	local info = {}
	info['type1'] = Types[memory.readbyte(startAddr + 6)]
	info['type2'] = Types[memory.readbyte(startAddr + 7)]
	info['gender_ratio'] = memory.readbyte(startAddr + 16)
	info['egg_cycles'] = memory.readbyte(startAddr + 17)
	info['growth_rate'] = GrowthRate[memory.readbyte(startAddr + 19)]
	info['egg_type1'] = EggTypes[memory.readbyte(startAddr + 20)]
	info['egg_type2'] = EggTypes[memory.readbyte(startAddr + 21)]
	info['ability1'] = getAbilityName(memory.readbyte(startAddr + 22))
	info['ability2'] = getAbilityName(memory.readbyte(startAddr + 23))
	info['national_dex'] = getNatDexNumber(index)
	return info
end

function getMoveData(index)
	local startAddr = romAddresses["attackData"] + (12 * index)
	local info = {}
	info["base_power"] = memory.readbyte(startAddr + 1)
	info["type"] = Types[memory.readbyte(startAddr + 2)]
	info["accuracy"] = memory.readbyte(startAddr + 3)
	info["pp"] = memory.readbyte(startAddr + 4)
	return info
end

function getAttackName(index)
	return grabTextFromMemory(romAddresses["attackNames"] + (index * 13), 13)
end
function getAbilityName(index)
	return grabTextFromMemory(romAddresses["abilityNames"] + (index * 13), 13)
end
function getSpeciesName(index)
	return grabTextFromMemory(romAddresses["pokemonNames"] + (index * 11), 11)
end
function getNatDexNumber(index)
	return memory.read_u16_le(romAddresses["nationalDexTable"] + ((index - 1) * 2), 'ROM')
end
function getMapName(index)
	if not index then
		return "???"
	elseif index == 0xFE then
		return "Trade"
	elseif index == 0xFF then
		return "Fateful Encounter"
	end
	local namePtr = memory.read_u32_le(romAddresses["mapLabelData"] + (index  * romAddresses["mapDataSize"]))
	if namePtr > 0x8000000 then
		namePtr = namePtr - 0x8000000
	end
	return grabTextFromMemory(namePtr, 22)
end
function getItemName(index)
	local name = grabTextFromMemory(romAddresses["itemData"] + (index * 44), 14)
	--Grab TM/HM Move Names
	if name:sub(1, 2) == "TM" and name:sub(3,3) ~= " " then -- avoid TM Case
		return name .. ' ' .. getAttackName(memory.read_u16_le(romAddresses["tmData"] + ((name:sub(3) - 1) * 2)))
	elseif name:sub(1 , 2) == "HM" then
		return name .. ' ' .. getAttackName(memory.read_u16_le(romAddresses["tmData"] + ((name:sub(3) - 1 + romAddresses["numTMs"]) * 2)))
	end
	return name
end
function itemIsKeyItem(index)
	return memory.readbyte(romAddresses["itemData"] + (index * 44) + 24) == 1
end
function getArbitraryLengthStringCollection(startAddr, count, memoryDomain)
	local i = 0
	local ptr = 0
	local collection = {}
	while i < count do
		local str = " "
		while string.byte(str, string.len(str)) ~= 0xFF do
			str = str..string.char(memory.readbyte(startAddr + ptr, memoryDomain))
			ptr = ptr + 1
		end
		collection[i] = translateRSEChars(str:sub(2))
		i = i + 1
	end
	return collection
end


-- EXP Functions
function calcErraticRate(n)
	if n < 50 then
		return n * n * n * (100 - n) / 50
	elseif n < 68 then
		return n * n * n * (150 - n) / 100
	elseif n < 98 then
		return n * n * n * math.floor((1911 - (10 * n)) / 3) / 500
	else
		return n * n * n * (160 - n) / 100
	end
end
function calcFastRate(n)
	return 4 * n * n * n / 5
end
function calcMedFastRate(n)
 	return n * n * n
end
function calcMedSlowRate(n)
	return ((6 / 5) * n * n * n) - (15 * n * n) + (100 * n) - 140
end
function calcSlowRate(n)
	return 5 * n * n * n / 4
end
function calcFluctuatingRate(n)
	if n < 15 then
		return n * n * n * ((math.floor((n + 1) / 3) + 24) / 50)
	elseif n < 36 then
		return n * n * n * ((n + 14) / 50)
	else
		return n * n * n * ((math.floor(n / 2) + 32) / 50)
	end	
end

calculateExpForLevel = {
	["Erratic"] = calcErraticRate,
	["Fast"] = calcFastRate,
	["Medium Fast"] = calcMedFastRate,
	["Medium Slow"] = calcMedSlowRate,
	["Slow"] = calcSlowRate,
	["Fluctuating"] = calcFluctuatingRate
}

--TODO: Maybe just do the above functions in reverse
function findLevelFromExp(growthRate, currentExp)
	for level = 1, 100 do
		if calculateExpForLevel[growthRate](level) > currentExp then
			return level - 1
		end
	end
	return 100
end

--lookup tables
-- Natures = { --not needed, get from ROM now
-- 	[0] = "Hardy",
-- 	[1] = "Lonely",
-- 	[2] = "Brave",
-- 	[3] = "Adamant",
-- 	[4] = "Naughty",
-- 	[5] = "Bold",
-- 	[6] = "Docile",
-- 	[7] = "Relaxed",
-- 	[8] = "Impish",
-- 	[9] = "Lax",
-- 	[10] = "Timid",
-- 	[11] = "Hasty",
-- 	[12] = "Serious",
-- 	[13] = "Jolly",
-- 	[14] = "Naive",
-- 	[15] = "Modest",
-- 	[16] = "Mild",
-- 	[17] = "Quiet",
-- 	[18] = "Bashful",
-- 	[19] = "Rash",
-- 	[20] = "Calm",
-- 	[21] = "Gentle",
-- 	[22] = "Sassy",
-- 	[23] = "Careful",
-- 	[24] = "Quirky",
-- }

Types = { --unfortunately not listed in ROM anywhere, they use icons
	[0] = "Normal",
	[1] = "Fighting",
	[2] = "Flying",
	[3] = "Poison",
	[4]	= "Ground",
	[5] = "Rock",
	[6] = "Bug",
	[7] = "Ghost",
	[8] = "Steel",
	[9] = "???",
	[10] = "Fire",
	[11] = "Water",
	[12] = "Grass",
	[13] = "Electric",
	[14] = "Psychic",
	[15] = "Ice",
	[16] = "Dragon",
	[17] = "Dark"
}

EggTypes = { --didn't check and see if this is listed in ROM yet
	[0] = "",
	[1] = "Monster",
	[2] = "Water 1",
	[3] = "Bug",
	[4] = "Flying",
	[5] = "Field",
	[6] = "Fairy",
	[7] = "Grass",
	[8] = "Human-Like",
	[9] = "Water 3",
	[10] = "Mineral",
	[11] = "Amorphous",
	[12] = "Water 2",
	[13] = "Ditto",
	[14] = "Dragon",
	[15] = "Undiscovered"
}

TrainerGender = {
	[0] = "Male",
	[1] = "Female"
}
OriginalGame = {
	[0] = "Colosseum Bonus Disc",
	[1] = "Sapphire",
	[2] = "Ruby",
	[3] = "Emerald",
	[4] = "FireRed",
	[5] = "LeafGreen",
	[15] = "Colosseum or XD"
}
ContestRank = {
	[2] = "Super",
	[3] = "Hyper",
	[4] = "Master"
}
GrowthRate = {
	[0] = "Medium Fast",
	[1] = "Erratic",
	[2] = "Fluctuating",
	[3] = "Medium Slow",
	[4] = "Fast",
	[5] = "Slow"
}

--this is the order the 12-byte blocks are in, based on personality value % 24
DataOrder = {
	[0] = "GAEM",
	[1] = "GAME",
	[2] = "GEAM",
	[3] = "GEMA",
	[4] = "GMAE",
	[5] = "GMEA",
	[6] = "AGEM",
	[7] = "AGME",
	[8] = "AEGM",	
	[9] = "AEMG",
	[10] = "AMGE",
	[11] = "AMEG",
	[12] = "EGAM",
	[13] = "EGMA",
	[14] = "EAGM",
	[15] = "EAMG",
	[16] = "EMGA",
	[17] = "EMAG",
	[18] = "MGAE",
	[19] = "MGEA",
	[20] = "MAGE",
	[21] = "MAEG",
	[22] = "MEGA",
	[23] = "MEAG"
}


--character map from RSE's encoding to UTF-8
RSECharmap = {
	[0x00] = string.char(0x20), -- space
	[0x01] = string.char(0xC3,0x80), -- À
	[0x02] = string.char(0xC3,0x81), -- Á
	[0x03] = string.char(0xC3,0x82), -- Â
	[0x04] = string.char(0xC3,0x87), -- Ç
	[0x05] = string.char(0xC3,0x88), -- È
	[0x06] = string.char(0xC3,0x89), -- É
	[0x07] = string.char(0xC3,0x8A), -- Ê
	[0x08] = string.char(0xC3,0x8B), -- Ë
	[0x09] = string.char(0xC3,0x8C), -- Ì
	[0x0A] = string.char(0xE3,0x81,0x93), -- こ
	[0x0B] = string.char(0xC3,0x8E), -- Î
	[0x0C] = string.char(0xC3,0x8F), -- Ï
	[0x0D] = string.char(0xC3,0x92), -- Ò
	[0x0E] = string.char(0xC3,0x93), -- Ó
	[0x0F] = string.char(0xC3,0x94), -- Ô
	[0x10] = string.char(0xC5,0x92), -- Œ
	[0x11] = string.char(0xC3,0x99), -- Ù
	[0x12] = string.char(0xC3,0x9A), -- Ú
	[0x13] = string.char(0xC3,0x9B), -- Û
	[0x14] = string.char(0xC3,0x91), -- Ñ
	[0x15] = string.char(0xC3,0x9F), -- ß
	[0x16] = string.char(0xC3,0xA0), -- à
	[0x17] = string.char(0xC3,0xA1), -- á
	[0x18] = string.char(0xE3,0x81,0xAD), -- ね
	[0x19] = string.char(0xC3,0xA7), -- ç
	[0x1A] = string.char(0xC3,0xA8), -- è
	[0x1B] = string.char(0xC3,0xA9), -- é
	[0x1C] = string.char(0xC3,0xAA), -- ê
	[0x1D] = string.char(0xC3,0xAB), -- ë
	[0x1E] = string.char(0xC3,0xAC), -- ì
	[0x1F] = string.char(0xE3,0x81,0xBE), -- ま
	[0x20] = string.char(0xC3,0xAE), -- î
	[0x21] = string.char(0xC3,0xAF), -- ï
	[0x22] = string.char(0xC3,0xB2), -- ò
	[0x23] = string.char(0xC3,0xB3), -- ó
	[0x24] = string.char(0xC3,0xB4), -- ô
	[0x25] = string.char(0xC5,0x93), -- œ
	[0x26] = string.char(0xC3,0xB9), -- ù
	[0x27] = string.char(0xC3,0xBA), -- ú
	[0x28] = string.char(0xC3,0xBB), -- û
	[0x29] = string.char(0xC3,0xB1), -- ñ
	[0x2A] = string.char(0xC2,0xBA), -- º
	[0x2B] = string.char(0xC2,0xAA), -- ª
	[0x2C] = "?", -- Unidentifiable superior/superscript character
	[0x2D] = string.char(0x26), -- &
	[0x2E] = string.char(0x2B), -- +
	[0x2F] = string.char(0xE3,0x81,0x82), -- あ
	[0x30] = string.char(0xE3,0x81,0x83), -- ぃ
	[0x31] = string.char(0xE3,0x81,0x85), -- ぅ
	[0x32] = string.char(0xE3,0x81,0x87), -- ぇ
	[0x33] = string.char(0xE3,0x81,0x89), -- ぉ
	[0x34] = string.char(0x4C,0x76), -- Lv
	[0x35] = string.char(0x3D), -- =
	[0x36] = string.char(0xE3,0x82,0x87), -- ょ
	[0x37] = string.char(0xE3,0x81,0x8C), -- が
	[0x38] = string.char(0xE3,0x81,0x8E), -- ぎ
	[0x39] = string.char(0xE3,0x81,0x90), -- ぐ
	[0x3A] = string.char(0xE3,0x81,0x92), -- げ
	[0x3B] = string.char(0xE3,0x81,0x94), -- ご
	[0x3C] = string.char(0xE3,0x81,0x96), -- ざ
	[0x3D] = string.char(0xE3,0x81,0x98), -- じ
	[0x3E] = string.char(0xE3,0x81,0x9A), -- ず
	[0x3F] = string.char(0xE3,0x81,0x9C), -- ぜ
	[0x40] = string.char(0xE3,0x81,0x9E), -- ぞ
	[0x41] = string.char(0xE3,0x81,0xA0), -- だ
	[0x42] = string.char(0xE3,0x81,0xA2), -- ぢ
	[0x43] = string.char(0xE3,0x81,0xA5), -- づ
	[0x44] = string.char(0xE3,0x81,0xA7), -- で
	[0x45] = string.char(0xE3,0x81,0xA9), -- ど
	[0x46] = string.char(0xE3,0x81,0xB0), -- ば
	[0x47] = string.char(0xE3,0x81,0xB3), -- び
	[0x48] = string.char(0xE3,0x81,0xB6), -- ぶ
	[0x49] = string.char(0xE3,0x81,0xB9), -- べ
	[0x4A] = string.char(0xE3,0x81,0xBC), -- ぼ
	[0x4B] = string.char(0xE3,0x81,0xB1), -- ぱ
	[0x4C] = string.char(0xE3,0x81,0xB4), -- ぴ
	[0x4D] = string.char(0xE3,0x81,0xB7), -- ぷ
	[0x4E] = string.char(0xE3,0x81,0xBA), -- ぺ
	[0x4F] = string.char(0xE3,0x81,0xBD), -- ぽ
	[0x50] = string.char(0xE3,0x81,0xA3), -- っ
	[0x51] = string.char(0xC2,0xBF), -- ¿
	[0x52] = string.char(0xC2,0xA1), -- ¡
	[0x53] = "Pk",
	[0x54] = "Mn",
	[0x55] = "Po",
	[0x56] = "Ké",
	[0x57] = "BL",
	[0x58] = "OC",
	[0x59] = "K",
	[0x5A] = string.char(0xC3,0x8D), -- Í
	[0x5B] = string.char(0x25), -- %
	[0x5C] = string.char(0x28), -- (
	[0x5D] = string.char(0x29), -- )
	[0x5E] = string.char(0xE3,0x82,0xBB), -- セ
	[0x5F] = string.char(0xE3,0x82,0xBD), -- ソ
	[0x60] = string.char(0xE3,0x82,0xBF), -- タ
	[0x61] = string.char(0xE3,0x83,0x81), -- チ
	[0x62] = string.char(0xE3,0x83,0x84), -- ツ
	[0x63] = string.char(0xE3,0x83,0x86), -- テ
	[0x64] = string.char(0xE3,0x83,0x88), -- ト
	[0x65] = string.char(0xE3,0x83,0x8A), -- ナ
	[0x66] = string.char(0xE3,0x83,0x8B), -- ニ
	[0x67] = string.char(0xE3,0x83,0x8C), -- ヌ
	[0x68] = string.char(0xC3,0xA2), -- â
	[0x69] = string.char(0xE3,0x83,0x8E), -- ノ
	[0x6A] = string.char(0xE3,0x83,0x8F), -- ハ
	[0x6B] = string.char(0xE3,0x83,0x92), -- ヒ
	[0x6C] = string.char(0xE3,0x83,0x95), -- フ
	[0x6D] = string.char(0xE3,0x83,0x98), -- ヘ
	[0x6E] = string.char(0xE3,0x83,0x9B), -- ホ
	[0x6F] = string.char(0xC3,0xAD), -- í
	[0x70] = string.char(0xE3,0x83,0x9F), -- ミ
	[0x71] = string.char(0xE3,0x83,0xA0), -- ム
	[0x72] = string.char(0xE3,0x83,0xA1), -- メ
	[0x73] = string.char(0xE3,0x83,0xA2), -- モ
	[0x74] = string.char(0xE3,0x83,0xA4), -- ヤ
	[0x75] = string.char(0xE3,0x83,0xA6), -- ユ
	[0x76] = string.char(0xE3,0x83,0xA8), -- ヨ
	[0x77] = string.char(0xE3,0x83,0xA9), -- ラ
	[0x78] = string.char(0xE3,0x83,0xAA), -- リ
	[0x79] = string.char(0xE2,0xAC,0x86), -- ⬆
	[0x7A] = string.char(0xE2,0xAC,0x87), -- ⬇
	[0x7B] = string.char(0xE2,0xAC,0x85), -- ⬅
	[0x7C] = string.char(0xE2,0x9E,0xA1), -- ➡
	[0x7D] = string.char(0xE3,0x83,0xB2), -- ヲ
	[0x7E] = string.char(0xE3,0x83,0xB3), -- ン
	[0x7F] = string.char(0xE3,0x82,0xA1), -- ァ
	[0x80] = string.char(0xE3,0x82,0xA3), -- ィ
	[0x81] = string.char(0xE3,0x82,0xA5), -- ゥ
	[0x82] = string.char(0xE3,0x82,0xA7), -- ェ
	[0x83] = string.char(0xE3,0x82,0xA9), -- ォ
	[0x84] = string.char(0xE3,0x83,0xA3), -- ャ
	[0x85] = string.char(0xE3,0x83,0xA5), -- ュ
	[0x86] = string.char(0xE3,0x83,0xA7), -- ョ
	[0x87] = string.char(0xE3,0x82,0xAC), -- ガ
	[0x88] = string.char(0xE3,0x82,0xAE), -- ギ
	[0x89] = string.char(0xE3,0x82,0xB0), -- グ
	[0x8A] = string.char(0xE3,0x82,0xB2), -- ゲ
	[0x8B] = string.char(0xE3,0x82,0xB4), -- ゴ
	[0x8C] = string.char(0xE3,0x82,0xB6), -- ザ
	[0x8D] = string.char(0xE3,0x82,0xB8), -- ジ
	[0x8E] = string.char(0xE3,0x82,0xBA), -- ズ
	[0x8F] = string.char(0xE3,0x82,0xBC), -- ゼ
	[0x90] = string.char(0xE3,0x82,0xBE), -- ゾ
	[0x91] = string.char(0xE3,0x83,0x80), -- ダ
	[0x92] = string.char(0xE3,0x83,0x82), -- ヂ
	[0x93] = string.char(0xE3,0x83,0x85), -- ヅ
	[0x94] = string.char(0xE3,0x83,0x87), -- デ
	[0x95] = string.char(0xE3,0x83,0x89), -- ド
	[0x96] = string.char(0xE3,0x83,0x90), -- バ
	[0x97] = string.char(0xE3,0x83,0x93), -- ビ
	[0x98] = string.char(0xE3,0x83,0x96), -- ブ
	[0x99] = string.char(0xE3,0x83,0x99), -- ベ
	[0x9A] = string.char(0xE3,0x83,0x9C), -- ボ
	[0x9B] = string.char(0xE3,0x83,0x91), -- パ
	[0x9C] = string.char(0xE3,0x83,0x94), -- ピ
	[0x9D] = string.char(0xE3,0x83,0x97), -- プ
	[0x9E] = string.char(0xE3,0x83,0x9A), -- ペ
	[0x9F] = string.char(0xE3,0x83,0x9D), -- ポ
	[0xA0] = string.char(0xE3,0x83,0x83), -- ッ
	[0xA1] = string.char(0x30), -- 0
	[0xA2] = string.char(0x31), -- 1
	[0xA3] = string.char(0x32), -- 2
	[0xA4] = string.char(0x33), -- 3
	[0xA5] = string.char(0x34), -- 4
	[0xA6] = string.char(0x35), -- 5
	[0xA7] = string.char(0x36), -- 6
	[0xA8] = string.char(0x37), -- 7
	[0xA9] = string.char(0x38), -- 8
	[0xAA] = string.char(0x39), -- 9
	[0xAB] = string.char(0x21), -- !
	[0xAC] = string.char(0x3F), -- ?
	[0xAD] = string.char(0x2E), -- .
	[0xAE] = string.char(0x2D), -- -
	[0xAF] = string.char(0xE3,0x83,0xBB), -- ・
	[0xB0] = string.char(0xE2,0x80,0xA6), -- …
	[0xB1] = string.char(0xE2,0x80,0x9C), -- “
	[0xB2] = string.char(0xE2,0x80,0x9D), -- ”
	[0xB3] = string.char(0xE2,0x80,0x98), -- ‘
	[0xB4] = string.char(0xE2,0x80,0x99), -- ’
	[0xB5] = string.char(0xE2,0x99,0x82), -- ♂
	[0xB6] = string.char(0xE2,0x99,0x80), -- ♀
	[0xB7] = string.char(0x24), -- $
	[0xB8] = string.char(0x2C), -- ,
	[0xB9] = string.char(0xC3,0x97), -- ×
	[0xBA] = string.char(0x2F), -- /
	[0xBB] = string.char(0x41), -- A
	[0xBC] = string.char(0x42), -- B
	[0xBD] = string.char(0x43), -- C
	[0xBE] = string.char(0x44), -- D
	[0xBF] = string.char(0x45), -- E
	[0xC0] = string.char(0x46), -- F
	[0xC1] = string.char(0x47), -- G
	[0xC2] = string.char(0x48), -- H
	[0xC3] = string.char(0x49), -- I
	[0xC4] = string.char(0x4A), -- J
	[0xC5] = string.char(0x4B), -- K
	[0xC6] = string.char(0x4C), -- L
	[0xC7] = string.char(0x4D), -- M
	[0xC8] = string.char(0x4E), -- N
	[0xC9] = string.char(0x4F), -- O
	[0xCA] = string.char(0x50), -- P
	[0xCB] = string.char(0x51), -- Q
	[0xCC] = string.char(0x52), -- R
	[0xCD] = string.char(0x53), -- S
	[0xCE] = string.char(0x54), -- T
	[0xCF] = string.char(0x55), -- U
	[0xD0] = string.char(0x56), -- V
	[0xD1] = string.char(0x57), -- W
	[0xD2] = string.char(0x58), -- X
	[0xD3] = string.char(0x59), -- Y
	[0xD4] = string.char(0x5A), -- Z
	[0xD5] = string.char(0x61), -- a
	[0xD6] = string.char(0x62), -- b
	[0xD7] = string.char(0x63), -- c
	[0xD8] = string.char(0x64), -- d
	[0xD9] = string.char(0x65), -- e
	[0xDA] = string.char(0x66), -- f
	[0xDB] = string.char(0x67), -- g
	[0xDC] = string.char(0x68), -- h
	[0xDD] = string.char(0x69), -- i
	[0xDE] = string.char(0x6A), -- j
	[0xDF] = string.char(0x6B), -- k
	[0xE0] = string.char(0x6C), -- l
	[0xE1] = string.char(0x6D), -- m
	[0xE2] = string.char(0x6E), -- n
	[0xE3] = string.char(0x6F), -- o
	[0xE4] = string.char(0x70), -- p
	[0xE5] = string.char(0x71), -- q
	[0xE6] = string.char(0x72), -- r
	[0xE7] = string.char(0x73), -- s
	[0xE8] = string.char(0x74), -- t
	[0xE9] = string.char(0x75), -- u
	[0xEA] = string.char(0x76), -- v
	[0xEB] = string.char(0x77), -- w
	[0xEC] = string.char(0x78), -- x
	[0xED] = string.char(0x79), -- y
	[0xEE] = string.char(0x7A), -- z
	[0xEF] = string.char(0xE2,0x96,0xB6), -- ▶
	[0xF0] = string.char(0x3A), -- :
	[0xF1] = string.char(0xC3,0x84), -- Ä
	[0xF2] = string.char(0xC3,0x96), -- Ö
	[0xF3] = string.char(0xC3,0x9C), -- Ü
	[0xF4] = string.char(0xC3,0xA4), -- ä
	[0xF5] = string.char(0xC3,0xB6), -- ö
	[0xF6] = string.char(0xC3,0xBC), -- ü
	[0xF7] = string.char(0xE2,0xAC,0x86), -- ⬆
	[0xF8] = string.char(0xE2,0xAC,0x87), -- ⬇
	[0xF9] = string.char(0xE2,0xAC,0x85), -- ⬅
	--nonprintables
	[0xFA] = "",
	[0xFB] = "",
	[0xFC] = "",
	[0xFD] = "",
	[0xFE] = "",
	[0xFF] = ""
}

--Pokemon Storage markings to UTF-8
Markings = {
	[0] = string.char(0xE2,0x97,0x8F), -- ●
	[1] = string.char(0xE2,0x96,0xA0), -- ■
	[2] = string.char(0xE2,0x96,0xB2), -- ▲
	[3] = string.char(0xE2,0x99,0xA5)  -- ♥
}

--lookups pulled from ROM
Natures = getArbitraryLengthStringCollection(romAddresses['natures'], 25, 'ROM')
NatDexToIndex = {}
for i = 0 , romAddresses["numberOfPokemon"] - 1 do
	NatDexToIndex[getNatDexNumber(i)] = i + 1
end