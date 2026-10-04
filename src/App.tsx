import { Providers } from '@/app/providers.tsx'
import { AppRouter } from '@/app/router.tsx'

export default function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  )
}
