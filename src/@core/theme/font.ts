// Next Imports
import { Public_Sans } from 'next/font/google'

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-public-sans',
  display: 'swap'
})

export default publicSans
