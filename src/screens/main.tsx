import { useState } from 'react'
import { Button, Col, Container, Form, Modal, Nav, Navbar, NavDropdown, Row } from 'react-bootstrap'
import db from '@/scripts/indexedDb'
import * as forge from 'node-forge'
import { downloadSignedText, prepare } from '@/scripts/pkcs'
import { importFile, importTextFile } from '@/scripts/file'
import NavButton from '@/components/navButton'

export default function MainPage() {
    const [text, setText] = useState<string | ''>('')
    const [showAbout, setShowAbout] = useState<boolean>(false)
    const [showSelect, setShowSelect] = useState<boolean>(false)
    const [certList, setCertList] = useState<string[]>([])
    const [error, setError] = useState<string>('')

    const [name, setName] = useState<string>('')
    const [cert, setCert] = useState<Uint8Array | null>(null)

    async function importCertificate(file: File) {
        const bytes = await importFile(file)
        if (!bytes) {
            setError('Не удалось загрузить файл')
            return
        }
        try {
            const { name } = prepare(bytes)
            db.addCert(name, bytes)
            setCertList(await db.addCert(name, bytes))
            setName(name)
            setCert(bytes)
        } catch {
            setError('Не получилось импортировать сертификат')
            return
        }
    }
    function LoadCertificate() {
        return (
            <Button variant="success" style={{ position: 'relative' }}>
                <input
                    style={{ opacity: 0, position: 'absolute', height: '100%', width: '100%', top: 0, left: 0 }}
                    type="file"
                    onChange={(e) => !!e.target.files && importCertificate(e.target.files[0])}
                />
                Добавить
            </Button>
        )
    }

    async function importText(file: File) {
        const bytes = await importTextFile(file)
        if (!bytes) {
            setError('Не удалось загрузить файл')
            return
        }
        try {
            const certLength = bytes[0]
            const signLength = bytes[1]
            const certificate = new Uint8Array(bytes.slice(2, certLength + 2))
            const signatureBytes = new Uint8Array(bytes.slice(certLength + 2, certLength + signLength + 2))
            const textBytes = new Uint8Array(bytes.slice(certLength + signLength + 2))
            const { publicKey, algorithm, name } = prepare(certificate)
            const text = new TextDecoder().decode(textBytes)
            const signature = new TextDecoder().decode(signatureBytes)
            const hash = forge.md[algorithm].create()
            hash.update(text)
            if (publicKey.verify(hash.digest().bytes(), signature)) {
                db.addCert(name, certificate)
                setName(name)
                setCert(cert)
                setText(text)
            } else throw 'Подпись не действительна'
        } catch (e) {
            setError('Невозможно прочитать подписанный файл: ' + JSON.stringify(e).toUpperCase())
        }
    }
    function LoadTextNavBar() {
        return (
            <NavButton>
                <input
                    style={{ opacity: 0, position: 'absolute', height: '100%', width: '100%', top: 0, left: 0 }}
                    type="file"
                    onChange={(e) => !!e.target.files && importText(e.target.files[0])}
                />
                Загрузить
            </NavButton>
        )
    }
    function LoadTextButton() {
        return (
            <Button style={{ position: 'relative' }}>
                <input
                    style={{ opacity: 0, position: 'absolute', height: '100%', width: '100%', top: 0, left: 0 }}
                    type="file"
                    onChange={(e) => !!e.target.files && importText(e.target.files[0])}
                />
                Загрузить документ
            </Button>
        )
    }

    return (
        <>
            <Navbar bg="dark" data-bs-theme="dark">
                <Container>
                    <Nav>
                        <NavDropdown title="Файл">
                            <NavButton onClick={() => setText('')}>Создать</NavButton>
                            <LoadTextNavBar />
                            <NavButton
                                onClick={() => cert && downloadSignedText(cert, text)}
                                disabled={!cert?.length || !text}>
                                Сохранить
                            </NavButton>
                            <NavDropdown.Divider />
                            <NavButton onClick={() => setShowAbout(true)}>О программе</NavButton>
                        </NavDropdown>
                        <NavDropdown title="Управление сертификатами">
                            <NavButton onClick={() => setShowSelect(true)}>Выбрать</NavButton>
                        </NavDropdown>
                    </Nav>
                </Container>
            </Navbar>
            <Container
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    rowGap: 10,
                    padding: 10,
                    height: `calc(100% - 56px)`,
                }}>
                <Row>
                    <Col xs={3}>
                        <Row>Имя пользователя:</Row>
                        <Row>
                            <b>{name}</b>
                        </Row>
                    </Col>
                    <Col style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button onClick={() => setShowSelect(true)}>Выбрать сертификат</Button>
                        <LoadTextButton />
                        <Button
                            onClick={() => cert && downloadSignedText(cert, text)}
                            disabled={!cert?.length || !text}>
                            Сохранить документ
                        </Button>
                    </Col>
                </Row>
                <Row style={{ display: 'flex', height: '100%' }}>
                    <Form.Control as="textarea" onChange={(e) => setText(e.target.value)} value={text} />
                </Row>
            </Container>

            <Modal show={showAbout} centered onHide={() => setShowAbout(false)} backdrop="static">
                <Modal.Header closeButton>
                    <h1>О программе</h1>
                </Modal.Header>
                <Modal.Body>
                    Перьков Александр, А-18-21, вариант 12. Алгоритм хеширования документа берётся из сертификата (у
                    полученных самоподписных сертификатов это sha1, у CertEnroll - sha256). Данная программа
                    предназначена для работы с сертификатами - их можно использовать для подписания и проверки подписи
                    документов. В данной реализации можно использовать сертификаты с подписью по алгоритму RSA. Пароль к
                    сертификату подставляется автоматически - слово &quot;password&quot;. Удаление сертификатов доступно
                    в окне выбора сертификатов. Сертификаты должны быть с уникальными именами.
                </Modal.Body>
            </Modal>

            <Modal
                show={showSelect}
                centered
                onHide={() => setShowSelect(false)}
                onShow={async () => db.getCertList().then((list) => setCertList(list as string[]))}
                backdrop="static">
                <Modal.Header closeButton>
                    <h1>Выбор сертификата</h1>
                </Modal.Header>
                <Modal.Body style={{ display: 'flex', flexDirection: 'column', rowGap: 10 }}>
                    {name && `Выбран ${name}`}
                    {certList.length > 0
                        ? certList.map((certName, index) => (
                              <Row key={index} style={{ width: '100%' }}>
                                  <Col>
                                      <Button
                                          style={{ width: '100%' }}
                                          onClick={async () => {
                                              setCert(await db.getCert(certName))
                                              setName(certName)
                                          }}>
                                          {certName}
                                      </Button>
                                  </Col>
                                  <Col xs="1">
                                      <Button
                                          variant="danger"
                                          onClick={async () => {
                                              if (certName == name) {
                                                  setCert(null)
                                                  setName('')
                                              }
                                              setCertList(await db.deleteCert(certName))
                                          }}>
                                          <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              width="16"
                                              height="16"
                                              fill="currentColor"
                                              className="bi bi-trash-fill"
                                              viewBox="0 0 16 16">
                                              <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0" />
                                          </svg>
                                      </Button>
                                  </Col>
                              </Row>
                          ))
                        : 'Нет сертификатов для выбора'}
                    <LoadCertificate />
                </Modal.Body>
            </Modal>

            <Modal show={!!error} onHide={() => setError('')} backdrop="static" centered>
                <Modal.Header>
                    <h1>Ошибка</h1>
                </Modal.Header>
                <Modal.Body>{error}</Modal.Body>
                <Modal.Footer>
                    <Button variant="danger" onClick={() => setError('')}>
                        ОК
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}
