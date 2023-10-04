import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from "azle";
import { v4 as uuidv4 } from "uuid";

// Define a virtual pet record
type VirtualPet = Record<{
  id: string;
  owner: string;
  name: string;
  species: string;
  happiness: nat64; // 0 to 100
  health: nat64;    // 0 to 100
  hunger: nat64;    // 0 to 100
  lastFed: Opt<nat64>;
}>;

// Define a time record
type Time = nat64;

const petStorage = new StableBTreeMap<string, VirtualPet>(0, 44, 1024);

// Function to create a new virtual pet
$update;
export function createVirtualPet(owner: string, name: string, species: string): Result<VirtualPet, string> {
  const id = uuidv4();
  const newPet: VirtualPet = {
    id,
    owner,
    name,
    species,
    happiness: 50,
    health: 100,
    hunger: 50,
    lastFed: Opt.None,
  };
  petStorage.insert(id, newPet);
  return Result.Ok(newPet);
}

// Function to feed a virtual pet
$update;
export function feedVirtualPet(id: string): Result<VirtualPet, string> {
  return match(petStorage.get(id), {
    Some: (pet) => {
      const currentTime: Time = ic.time();
      pet.hunger = 0;
      pet.lastFed = Opt.Some(currentTime);
      // Adjust happiness and health based on the feeding
      // (You can implement more complex logic here)
      petStorage.insert(id, pet);
      return Result.Ok(pet);
    },
    None: () => Result.Err(`Couldn't find a virtual pet with id=${id}.`),
  });
}

// Function to get all virtual pets owned by a user
$query;
export function getOwnedVirtualPets(owner: string): Result<Vec<VirtualPet>, string> {
  const userPets = petStorage.values().filter((pet) => pet.owner === owner);
  return Result.Ok(userPets);
}
