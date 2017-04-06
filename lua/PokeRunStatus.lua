--This script will eventually take care of transmitting the run status to the TPP API.
--However, it can't run all on its own. a Pokemon Data script, such as PokeRSEData.lua needs to also be loaded

local hudEndpoint = "http://127.0.0.1:1337/"

if http == nil then
	local http = require("socket.http")
	http.TIMEOUT = 0.01
end
JSON = (loadfile "JSON.lua")()

function getParty()
	if (getPartyPokemon == nil) then
		return print("No Pokemon Data script is installed")
	end
	return JSON:encode(getPartyPokemon())
end

function getTrainer()
if (getTrainerData == nil) then
		return print("No Pokemon Data script is installed")
	end
	return JSON:encode(getTrainerData())
end

function getEnemyTeam()
	if (getEnemyPokemon == nil) then
		return print("No Pokemon Data script is installed")
	end
	return JSON:encode(getEnemyPokemon())
end

function getPCPokemon(boxNum)
	if (getBoxedPokemon == nil) then
		return print("No Pokemon Data script is installed")
	end
	return JSON:encode(getBoxedPokemon(boxNum))
end

function sendParty()
	http.request(hudEndpoint, getParty())
end

function sendTrainer()
	http.request(hudEndpoint, getTrainer())
end

function sendPC(boxNum)
	http.request(hudEndpoint, getPCPokemon(boxNum))
end

local boxNum = 1

function sendData(frame)
	if frame % 18000 == 0 then --once every 5 minutes
		sendPC(boxNum)
		boxNum = (boxNum % 14) + 1
	elseif frame % 1800 == 0 then --once every 30 seconds
		sendPC(getCurrentPCBox())
	-- elseif frame % 20 == 0 then --once every 20 frames
	elseif frame % 10 == 0 then --once every 10 frames
		sendTrainer()
	-- elseif frame % 10 == 0 then --once every 10 frames
	else --once every frame
		sendParty()
	end
end

while true do
	emu.frameadvance()
	sendData(emu.framecount())
end