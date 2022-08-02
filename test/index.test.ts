import {expect} from 'chai'
import {
    AllocationByHouseAndRoom,
    AllocationByName,
    checkPreferences,
    convertAllocationToHouses, convertAllocationToNames, doSimulatedAnnealing, House
} from "../src";
import {preferences} from "../src/preferences";

const setPreferences = (): void => {
    preferences.set('adam', ['belinda', 'connor', 'daria'])
    preferences.set('belinda', ['connor', 'daria', 'evan'])
    preferences.set('connor', ['daria', 'evan', 'adam'])
    preferences.set('daria', ['evan', 'adam', 'belinda'])
    preferences.set('evan', ['adam', 'belinda', 'connor'])
    preferences.set('xavier', ['adam', 'belinda', 'connor'])
    preferences.set('qq', ['uu'])
    preferences.set('uu', ['qq'])
}

const generateAllocationByName = (): AllocationByName => {
    const input: AllocationByName = new Map()
    input.set('adam', [0, 0])
    input.set('belinda', [0, 0])
    input.set('connor', [0, 1])
    input.set('daria', [0, 1])
    input.set('evan', [0, 2])
    input.set('xavier', [0, 2])
    input.set('qq', [1, 0])
    input.set('uu', [1, 0])
    return input
}

const generateAllocationByRoom = (): AllocationByHouseAndRoom => {
    const output: AllocationByHouseAndRoom = new Map<number, House>()
    output.set(0, {
        0: ['adam', 'belinda'],
        1: ['connor', 'daria'],
        2: ['evan', 'xavier'],
    })
    output.set(1, {
        0: ['qq', 'uu'],
    })
    return output
}

describe('the room allocator', () => {
    describe('the rearranger', () => {
        it('should rearrange the allocation', () => {
            const input = generateAllocationByName()
            const output = generateAllocationByRoom()
            expect(convertAllocationToHouses(input)).to.deep.equal(output)
        })
        it('should reverse rearrangement', () => {
            const input = generateAllocationByName()
            const output = generateAllocationByRoom()
            expect(convertAllocationToNames(output)).to.deep.equal(input)
        })
    })
    describe('the preference checker', () => {
        before(() => {
            setPreferences()
        })
        after(() => {
            preferences.clear()
        })
        it('should check the preferences one way', () => {
            const output = checkPreferences('adam', 'belinda', 1)
            expect(output).to.equal(1)
        })
        it('should be symmetrical', () => {
            const output = checkPreferences('belinda', 'adam', 1)
            const output2 = checkPreferences('adam', 'belinda', 1)
            expect(output).to.equal(output2)
        })
        it('should check the preferences both ways', () => {
            const output = checkPreferences('daria', 'xavier', 1)
            expect(output).to.equal(2)
        })
        it('should check the preferences both ways nice', () => {
            const output = checkPreferences('qq', 'uu', 1)
            expect(output).to.equal(0)
        })
    })
    describe('should do an allocation', () => {
        before(() => {
            setPreferences()
        })
        after(() => {
            preferences.clear()
        })
        it('should do an allocation', () => {
            const output = doSimulatedAnnealing()
            expect(output.get('qq')).to.deep.equal([1, 0])
            expect(output.get('uu')).to.deep.equal([1, 0])
        })
    })
})