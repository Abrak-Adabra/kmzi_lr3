class DB {
    private db: IDBDatabase | null = null
    constructor() {
        if (typeof indexedDB == 'undefined') return
        const openRequest = indexedDB.open('kmzi_lr3')
        const createDb: Promise<IDBDatabase> = new Promise((resolve) => {
            openRequest.onupgradeneeded = function () {
                openRequest.result.createObjectStore('keyPairs', { keyPath: 'name' })
            }
            openRequest.onsuccess = function () {
                resolve(openRequest.result)
            }
        })
        Promise.resolve(createDb).then((db) => (this.db = db))
    }

    private transaction() {
        return this.db?.transaction('keyPairs', 'readwrite').objectStore('keyPairs')
    }

    getCert(name: string) {
        return new Promise<Uint8Array>((resolve) => {
            const request = this.transaction()?.get(name)
            if (request) {
                request.onsuccess = () => {
                    resolve(request.result ? request.result.cert : undefined)
                }
            }
        })
    }

    deleteCert(name: string) {
        return new Promise<string[]>((resolve) => {
            const request = this.transaction()?.delete(name)
            if (request) {
                request.onsuccess = async () => {
                    resolve((await this.getCertList()) as string[])
                }
            }
        })
    }

    addCert(name: string, cert: Uint8Array) {
        return this.getCert(name).then(
            () =>
                new Promise<string[]>((resolve) => {
                    const request = this.transaction()?.put({ name, cert })
                    if (request) {
                        request.onsuccess = async () => {
                            resolve((await this.getCertList()) as string[])
                        }
                    }
                })
        )
    }

    getCertList() {
        return new Promise<IDBValidKey[]>((resolve) => {
            const request = this.transaction()?.getAllKeys()
            if (request) {
                request.onsuccess = () => {
                    resolve(request.result)
                }
            }
        })
    }
}

const db = new DB()
export default db
