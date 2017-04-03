--This script will eventually take care of transmitting the run status to the TPP API.
--However, it can't run all on its own. a Pokemon Data script, such as PokeRSEData.lua needs to also be loaded

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

-- while true do
-- 	emu.frameadvance();
-- end