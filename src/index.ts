import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from "azle";
import { v4 as uuidv4 } from "uuid";

// Define a virtual pet record
type VirtualPet = Record<{
  id: string;
  owner: string;
  name: string;
  species: string;
  happiness: number; // 0 to 100
  health: number;    // 0 to 100
  hunger: number;    // 0 to 100
  createdAt: nat64,
  lastFed: Opt<nat64>;
}>;

type VirtualPetPayload = Record<{
  owner: string;
  name: string;
  species: string;
}>;

// Define a time record
type Time = nat64;

const petStorage = new StableBTreeMap<string, VirtualPet>(0, 44, 1024);

// Function to create a new virtual pet
$update;
export function createVirtualPet(owner: string, name: string, species: string): Result<VirtualPet, string> {
  const id = uuidv4();

  // Create new pet object with timestamp
  const newPet: VirtualPet = {
    id,
    happiness: 50,
    health: 100,
    hunger: 50,
    owner: payload.owner,
    name: payload.name,
    species: payload.species,
    lastFed: Opt.None,
    createdAt: ic.time()
  };

  // Insert new pet into storage
  try {
    petStorage.insert(id, newPet);
    // Return new pet
    return Result.Ok(newPet);
  } catch (error) {
    // Handle the error here, such as logging or returning an error result
    return Result.Err("Failed to insert pet into storage.");
  }
}

// Function to feed a virtual pet
$update;
export function feedVirtualPet(id: string): Result<VirtualPet, string> {
  return match(petStorage.get(id), {
    Some: (pet) => {
      // Get the current time
      const currentTime: Time = ic.time();

      // Create an updated pet object after feeding
      const updatedPet = {
        ...pet,
        hunger: 0,                    // Reset hunger to 0 after feeding
        lastFed: Opt.Some(currentTime), // Update the lastFed timestamp

        // You can add more logic here to adjust happiness and health based on the feeding action
        // For example, you could increase happiness and maintain health if the pet is fed on time.
        // However, this logic is a placeholder, and you can customize it according to your requirements.
      };

      try {
        // Insert the updated pet back into storage
        petStorage.insert(id, updatedPet);
        // Return the updated pet as a successful result
        return Result.Ok<VirtualPet, string>(updatedPet);
      } catch (error) {
        // Handle the error here, such as logging or returning an error result
        return Result.Err<VirtualPet, string>("Failed to insert pet into storage.");
      }
    },
    None: () => Result.Err<VirtualPet, string>(`Couldn't find a virtual pet with id=${id}.`),
  });
}

// Function to get all virtual pets owned by a user
$query;
export function getOwnedVirtualPets(owner: string): Result<Vec<VirtualPet>, string> {
  const userPets = petStorage.values().filter((pet) => pet.owner === owner);
  return Result.Ok(userPets);
}

globalThis.crypto = {
  //@ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
