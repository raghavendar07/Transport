import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Input,
  FormField,
  Select,
  Checkbox,
  Textarea,
  FileUpload,
  Tabs,
  TabsList,
  TabTrigger,
  TabPanel,
  Spinner,
  useToast,
} from '@/components/ui'
import { useSettings, useUpdateSettings } from '../hooks'

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
]

const TIMEZONES = ['Europe/London', 'Europe/Dublin', 'Europe/Paris', 'UTC'].map((t) => ({ value: t, label: t }))

export function SettingsPage() {
  const { data, isLoading } = useSettings()
  const update = useUpdateSettings()
  const toast = useToast()

  // General
  const [timezone, setTimezone] = useState('')
  const [workingDays, setWorkingDays] = useState<string[]>([])
  const [amTime, setAmTime] = useState('')
  const [pmTime, setPmTime] = useState('')
  // Branding
  const [header, setHeader] = useState('')
  const [footer, setFooter] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  useEffect(() => {
    if (!data) return
    setTimezone(data.timezone)
    setWorkingDays(data.workingDays)
    setAmTime(data.amRouteTime)
    setPmTime(data.pmRouteTime)
    setHeader(data.reportHeader)
    setFooter(data.reportFooter)
    setLogo(data.logoDataUrl)
  }, [data])

  function toggleDay(day: string) {
    setWorkingDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  async function saveGeneral() {
    await update.mutateAsync({ timezone, workingDays, amRouteTime: amTime, pmRouteTime: pmTime })
    toast.success('General settings saved')
  }

  async function saveBranding() {
    let logoDataUrl = logo
    if (logoFile) {
      logoDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(logoFile)
      })
    }
    await update.mutateAsync({ reportHeader: header, reportFooter: footer, logoDataUrl })
    setLogo(logoDataUrl)
    setLogoFile(null)
    toast.success('Branding saved')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Company-wide configuration." />
      <Tabs defaultValue="general">
        <TabsList>
          <TabTrigger value="general">General</TabTrigger>
          <TabTrigger value="branding">Branding</TabTrigger>
        </TabsList>

        <TabPanel value="general">
          <Card>
            <CardBody className="space-y-4">
              <FormField label="Timezone" required>
                {(f) => <Select {...f} value={timezone} onValueChange={setTimezone} options={TIMEZONES} />}
              </FormField>
              <div>
                <span className="mb-1.5 block text-sm font-medium text-text">Working days</span>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d) => (
                    <label
                      key={d.key}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <Checkbox checked={workingDays.includes(d.key)} onCheckedChange={() => toggleDay(d.key)} aria-label={d.label} />
                      {d.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Default AM route time" required>
                  {(f) => <Input type="time" {...f} value={amTime} onChange={(e) => setAmTime(e.target.value)} />}
                </FormField>
                <FormField label="Default PM route time" required>
                  {(f) => <Input type="time" {...f} value={pmTime} onChange={(e) => setPmTime(e.target.value)} />}
                </FormField>
              </div>
            </CardBody>
            <CardFooter>
              <Button onClick={saveGeneral} loading={update.isPending}>
                Save general
              </Button>
            </CardFooter>
          </Card>
        </TabPanel>

        <TabPanel value="branding">
          <Card>
            <CardBody className="space-y-4">
              <div>
                <span className="mb-1.5 block text-sm font-medium text-text">Company logo</span>
                {logo && (
                  <img src={logo} alt="Current logo" className="mb-2 h-16 rounded border border-border object-contain p-1" />
                )}
                <FileUpload value={logoFile} onChange={setLogoFile} accept="image/*" maxSize={2 * 1024 * 1024} />
              </div>
              <FormField label="Report header" hint="Appears at the top of generated PDF reports">
                {(f) => <Input {...f} value={header} onChange={(e) => setHeader(e.target.value)} />}
              </FormField>
              <FormField label="Report footer">
                {(f) => <Textarea {...f} value={footer} onChange={(e) => setFooter(e.target.value)} />}
              </FormField>
            </CardBody>
            <CardFooter>
              <Button onClick={saveBranding} loading={update.isPending}>
                Save branding
              </Button>
            </CardFooter>
          </Card>
        </TabPanel>
      </Tabs>
    </div>
  )
}
