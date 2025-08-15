import '../styles/globals.css'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>SEI EVM Token Faucet</title>
        <meta name="description" content="Get free testnet tokens for SEI EVM development" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph / Social Media Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="SEI EVM Token Faucet" />
        <meta property="og:description" content="Get free testnet tokens for SEI EVM development" />
        <meta property="og:image" content="/og-image.png" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SEI EVM Token Faucet" />
        <meta name="twitter:description" content="Get free testnet tokens for SEI EVM development" />
        <meta name="twitter:image" content="/og-image.png" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#f97316" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}