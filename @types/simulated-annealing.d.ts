declare module 'simulated-annealing' {
    const calculate: <T>(options: {
        initialState: T,
        tempMax: number,
        tempMin: number,
        newState: (input: T) => T,
        getTemp: (input: number) => number,
        getEnergy: (input: T) => number,
    }) => T
    export = calculate
}