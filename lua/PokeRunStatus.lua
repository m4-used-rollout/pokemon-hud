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
	--Sends a single PC box once per minute (on the minute) (takes 14 minutes to send entire PC)
	--Sends the current PC box once per minute (at the 30 second mark)
	--Sends the current Trainer data 5 times per second (every 10 frames, unless sending PC data)
	--Sends the current Party 54 times per second (every frame, unless sending PC or Trainer data)

	if frame and frame % 3200 == 0 then --once every minute
		sendPC(boxNum)
		boxNum = (boxNum % 14) + 1
	elseif frame and frame % 1800 == 0 then --once every 30 seconds
		sendPC(getCurrentPCBox())
	elseif frame % 10 == 0 then --once every 10 frames
		sendTrainer()
	else --once every frame
		sendParty()
	end
end

while true do
	emu.frameadvance()
	sendData(emu.framecount())
end