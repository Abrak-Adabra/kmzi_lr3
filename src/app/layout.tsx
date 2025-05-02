export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="ru">
            <head>
                <title>ЛР 3</title>
            </head>
            <body>{children}</body>
        </html>
    )
}
