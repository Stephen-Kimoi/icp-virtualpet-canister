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
export function createVirtualPet(payload: VirtualPetPayload): Result<VirtualPet, string> {
  // Validate payload
  if (!payload.owner || !payload.name || !payload.species) {
    return Result.Err("Invalid payload: owner, name, and species are required fields.");
  }

  // Check if a pet with the same name and owner already exists
  const existingPet = petStorage.values().find(pet => pet.owner === payload.owner && pet.name === payload.name);
  if (existingPet) {
    return Result.Err("A pet with the same name and owner already exists.");
  }

  // Generate unique id
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
  // Check if the provided id is a valid string
  if (typeof id !== 'string') {
    return Result.Err<VirtualPet, string>('id must be a string');
  }

  // Check if the id is empty
  if (id === "") {
    return Result.Err<VirtualPet, string>('id cannot be empty');
  }

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
  // Suggestion 1: Instead of filtering all pets in `petStorage`, consider indexing pets by owner for faster lookup.
  const ownerPets = petStorage.values().filter((pet) => pet.owner === owner);

  // Suggestion 4: Consider adding error handling for the case where no pets are found for the given owner.
  if (ownerPets.length === 0) {
    return Result.Err("No pets found for the given owner");
  }

  // Suggestion 2: Consider using a more specific error message in the `Result` type instead of a generic string.
  return Result.Ok(ownerPets);
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
