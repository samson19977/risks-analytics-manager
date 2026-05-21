import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'AB Rwanda Risk Analytics Platform',
  description: 'Advanced Risk Analytics & AI-Powered Decision Intelligence for AB Rwanda PLC',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
