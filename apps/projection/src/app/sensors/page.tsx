import SensorsClient from './SensorsClient'

export const dynamic = 'force-dynamic'

export default function SensorsPage() {
  return <SensorsClient node="personal" />
}
