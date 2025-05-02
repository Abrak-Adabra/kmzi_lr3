import * as forge from 'node-forge'

export function prepare(bytes: Uint8Array) {
    const pkcs = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(String.fromCharCode(...bytes)), false, 'password')
    const privateKey = pkcs.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
        forge.pki.oids.pkcs8ShroudedKeyBag
    ]?.[0]?.key as forge.pki.rsa.PrivateKey

    const certBag = pkcs.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag]?.[0] as forge.pkcs12.Bag
    const publicKey = certBag?.cert?.publicKey as forge.pki.rsa.PublicKey
    const name = (certBag?.attributes as { friendlyName: string[] }).friendlyName[0]
    const algorithm = certBag.cert?.md.algorithm as forge.md.Algorithm
    return { privateKey, publicKey, name, algorithm, certBag }
}

export function downloadSignedText(certificate: Uint8Array, text: string) {
    const textData = new Uint8Array(new TextEncoder().encode(text))
    const { privateKey, algorithm } = prepare(certificate)
    const hash = forge.md[algorithm].create()
    hash.update(text)
    const signature = privateKey.sign(hash)
    const signatureData = new Uint8Array(new TextEncoder().encode(signature))
    const data = [
        Uint16Array.from([certificate.length, signatureData.length, ...certificate, ...signatureData, ...textData]),
    ]
    const signedText = new Blob(data, {
        type: 'application/octet-stream',
    })
    const url = URL.createObjectURL(signedText)
    const a = document.createElement('a')
    a.href = url
    a.download = 'signed_text.sd'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
