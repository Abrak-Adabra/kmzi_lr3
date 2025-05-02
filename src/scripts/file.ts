export async function importFile(file: File) {
    const reader = new FileReader()
    const bytes = await new Promise<Uint8Array | null>((resolve) => {
        if (file == null) return
        reader.readAsArrayBuffer(file)
        reader.onload = () => {
            if (typeof reader.result != 'string' && reader.result != null) resolve(new Uint8Array(reader.result))
        }
    })
    return bytes
}

export async function importTextFile(file: File) {
    const reader = new FileReader()
    const bytes = await new Promise<Uint16Array | null>((resolve) => {
        if (file == null) return
        reader.readAsArrayBuffer(file)
        reader.onload = () => {
            if (typeof reader.result != 'string' && reader.result != null) resolve(new Uint16Array(reader.result))
        }
    })
    return bytes
}
