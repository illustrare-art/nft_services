export type MintSingleRequestData = {
    photo: any,
    name:string,
    description:string,
    user: {
        publicKey:Blob,
        secretKey:Blob
    }
}

export type FunctionsMessage<A> = {
    data : A;
}