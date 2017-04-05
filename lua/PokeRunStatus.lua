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

function getPCPokemon()
	if (getBoxedPokemon == nil) then
		return print("No Pokemon Data script is installed")
	end
	return JSON:encode(getBoxedPokemon())
end

function sendParty()
	http.request(hudEndpoint, getParty())
end

function sendTrainer()
	http.request(hudEndpoint, getTrainer())
end

function sendPC()
	http.request(hudEndpoint, getPCPokemon())
end

function sendData(frame)
	if frame % 30 == 0 then
		--sendPC()
	elseif frame % 20 == 0 then
	-- elseif frame % 10 == 0 then
		sendTrainer()
	elseif frame % 10 == 0 then
	-- else	
		sendParty()
	end
end

while true do
	emu.frameadvance()
	sendData(emu.framecount())
end