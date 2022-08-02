import * as simulatedAnnealing from 'simulated-annealing'
import {cloneDeep, shuffle} from 'lodash'
import {preferences} from "./preferences";

export type Prefs = Map<string, string[]>
export type House = Record<number, string[]>

export type AllocationByName = Map<string, [number, number]>
export type AllocationByHouseAndRoom = Map<number, House>

const HOUSE_COST = 10
const ROOM_COST = 100

const makeRoom = (house: Record<number, string[]>, room: number) => {
    const newArray = []
    house[room] = newArray
    return house[room]
}

const makeHouse = (input: AllocationByHouseAndRoom, house: number) => {
    const newHouse: House = {}
    input.set(house, newHouse)
    return newHouse
}

export const convertAllocationToHouses = (allocation: AllocationByName): AllocationByHouseAndRoom => {
    const output: AllocationByHouseAndRoom = new Map()
    allocation.forEach(([house, room], personName) => {
        const currentHouse = output.get(house) || makeHouse(output, house)
        const currentRoom = currentHouse[room] || makeRoom(currentHouse, room)
        currentRoom.push(personName)
    })
    return output
}

export const convertAllocationToNames = (allocation: AllocationByHouseAndRoom): AllocationByName => {
    const output: AllocationByName = new Map()
    allocation.forEach((house, houseNumber) => {
        Object.entries(house).forEach(([room, people]) => {
            people.forEach((person) => {
                output.set(person, [houseNumber, +room])
            })
        })
    })
    return output
}

const makeRandomAllocation = (maxRoomsPerHouse = 2, maxPeoplePerRoom): AllocationByName => {
    const output: AllocationByName = new Map()
    const shuffledNames = shuffle(Array.from(preferences.keys()))

    let currentHouse = 0
    let currentRoom = 0
    let occupants = 0

    for(let i = 0; i < shuffledNames.length; i++) {
        output.set(shuffledNames[i], [currentHouse, currentRoom])
        occupants++
        if(occupants >= maxPeoplePerRoom){
            occupants = 0
            currentRoom++
            if(currentRoom >= maxRoomsPerHouse){
                currentRoom = 0
                currentHouse++
            }
        }
    }
    return output
}

export const checkPreferences = (personA: string, personB: string, cost: number) => {
    let output = 0
    const preferenceA = preferences.get(personA)
    const preferenceB = preferences.get(personB)
    if(!(preferenceA.includes(personB))) {
        output += cost
    }
    if(!(preferenceB.includes(personA))) {
        output += cost
    }
    return output
}

const getCost = (allocation: AllocationByName): number => {
    let output = 0
    const allocationByHouseAndRoom = convertAllocationToHouses(allocation)
    allocationByHouseAndRoom.forEach((house) => {
        Object.values(house).forEach((room) => {
            for(let i = 0; i < room.length; i++) {
                for(let j = 0; j < room.length; j++) {
                    if(i === j) continue
                    output += checkPreferences(room[i], room[j], ROOM_COST)
                }
            }
        })
        const allResidents = Object.values(house).flat()
        for(let i = 0; i < allResidents.length; i++) {
            for(let j = 0; j < allResidents.length; j++) {
                if(i === j) continue
                output += checkPreferences(allResidents[i], allResidents[j], HOUSE_COST)
            }
        }
    })
    return output
}

const makeDeepCopy = <T>(input: T): T => cloneDeep(input)

function getRandomKey <T>(collection: Map<T, any>, key: number): T {
    let keys = Array.from(collection.keys());
    return keys[key];
}

const doSwitch = (x: AllocationByName): AllocationByName => {
    if(Math.floor(Math.random() * 100) < 25) {
        return switchPeople(x);
    }
    else {
        return switchRooms(x)
    }
}

const switchPeople = (x: AllocationByName): AllocationByName => {
    const length = x.size;
    let switchFrom = ''
    let switchTo = ''
    while (switchFrom === switchTo && x.get(switchFrom) === x.get(switchTo)) {
        switchFrom = getRandomKey(x, Math.floor(Math.random() * length));
        switchTo = getRandomKey(x,Math.floor(Math.random() * length));
    }
    const temp = makeDeepCopy(x.get(switchFrom))
    x.set(switchFrom, makeDeepCopy(x.get(switchTo)))
    x.set(switchTo, temp)
    return x
}

const getNumberOfRooms = (input: House): number => {
    return Object.keys(input).length
}

const getRandomRoom = (input: House): number => {
    const numberOfRooms = getNumberOfRooms(input)
    return Math.floor(Math.random() * numberOfRooms)
}

const getRoomOccupants = (allocation: AllocationByHouseAndRoom, input: number, room: number): string[] => {
    return allocation.get(input)[room]
}

const setRoom = (allocation: AllocationByHouseAndRoom, house: number, room: number, occupants: string[]): void => {
    const newAllocation = allocation.get(house)
    newAllocation[room] = occupants
    allocation.set(house, newAllocation)
}

const switchRooms = (x: AllocationByName): AllocationByName => {
    const allocationByRooms = convertAllocationToHouses(x)
    const length = allocationByRooms.size;
    let switchHouseFrom = 0, switchRoomFrom = 0, switchRoomTo = 0, switchHouseTo = 0
    while (getRoomOccupants(allocationByRooms, switchHouseFrom, switchRoomFrom) === getRoomOccupants(allocationByRooms, switchHouseTo, switchRoomTo)) {
        switchHouseFrom = getRandomKey(allocationByRooms, Math.floor(Math.random() * length));
        switchRoomFrom = getRandomRoom(allocationByRooms.get(switchHouseFrom))
        switchHouseTo = getRandomKey(allocationByRooms, Math.floor(Math.random() * length));
        switchRoomTo = getRandomRoom(allocationByRooms.get(switchHouseTo));
    }
    const temp = makeDeepCopy(getRoomOccupants(allocationByRooms, switchHouseFrom, switchRoomFrom))
    setRoom(allocationByRooms, switchHouseFrom, switchRoomFrom, getRoomOccupants(allocationByRooms, switchHouseTo, switchRoomTo))
    setRoom(allocationByRooms, switchHouseTo, switchRoomTo, temp)
    return convertAllocationToNames(allocationByRooms)
}

const newState = (x: AllocationByName): AllocationByName => {
    const input = makeDeepCopy(x)
    return doSwitch(input)
}

// linear temperature decreasing
const getTemp = (prevTemperature: number) => {
    return prevTemperature - 0.001;
}

export const doSimulatedAnnealing = (): AllocationByName => simulatedAnnealing({
    initialState: makeRandomAllocation(3, 2),
    tempMax: 15,
    tempMin: 0.001,
    newState: newState,
    getTemp: getTemp,
    getEnergy: getCost,
});