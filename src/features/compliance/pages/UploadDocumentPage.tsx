import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { PageHeader } from '@/components/layout'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Input,
  Textarea,
  FormField,
  Select,
  DatePicker,
  FileUpload,
  useToast,
} from '@/components/ui'
import { documentSchema, type DocumentValues } from '../schema'
import { documentsApi } from '../hooks'
import { driversApi, vehiclesApi } from '@/features/fleet-clients/hooks'

export function UploadDocumentPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const create = documentsApi.useCreate()
  const [file, setFile] = useState<File | null>(null)
  const drivers = driversApi.useList({ pageSize: 100 })
  const vehicles = vehiclesApi.useList({ pageSize: 100 })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DocumentValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: { scope: 'business', scopeRefId: null, title: '', type: '', issueDate: '', expiryDate: null, notes: '' },
  })

  const scope = watch('scope')
  const scopeRefId = watch('scopeRefId')

  async function onSubmit(values: DocumentValues) {
    if (!file) {
      toast.error('File required', 'Attach a document file (max 10 MB).')
      return
    }
    await create.mutateAsync({
      ...values,
      expiryDate: values.expiryDate || null,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    })
    toast.success('Document uploaded')
    navigate('/documents')
  }

  const refOptions =
    scope === 'driver'
      ? (drivers.data?.items ?? []).map((d) => ({ value: d.id, label: d.name }))
      : scope === 'vehicle'
        ? (vehicles.data?.items ?? []).map((v) => ({ value: v.id, label: v.registration }))
        : []

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Upload document"
        breadcrumbs={[{ label: 'Documents', to: '/documents' }, { label: 'Upload' }]}
      />
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Scope" required error={errors.scope?.message}>
                {(f) => (
                  <Select
                    {...f}
                    value={scope}
                    onValueChange={(v) => {
                      setValue('scope', v as DocumentValues['scope'])
                      setValue('scopeRefId', null)
                    }}
                    options={[
                      { value: 'business', label: 'Business' },
                      { value: 'driver', label: 'Driver' },
                      { value: 'vehicle', label: 'Vehicle' },
                    ]}
                  />
                )}
              </FormField>
              {scope !== 'business' && (
                <FormField label={scope === 'driver' ? 'Driver' : 'Vehicle'} required>
                  {(f) => (
                    <Select
                      {...f}
                      value={scopeRefId ?? ''}
                      onValueChange={(v) => setValue('scopeRefId', v)}
                      options={refOptions}
                      placeholder="Select"
                    />
                  )}
                </FormField>
              )}
            </div>
            <FormField label="Title" required error={errors.title?.message}>
              {(f) => <Input {...f} {...register('title')} />}
            </FormField>
            <FormField label="Document type" required error={errors.type?.message} hint="e.g. Insurance, Licence, DBS">
              {(f) => <Input {...f} {...register('type')} />}
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Issue date" required error={errors.issueDate?.message}>
                {(f) => <DatePicker {...f} {...register('issueDate')} />}
              </FormField>
              <FormField label="Expiry date" hint="Leave blank if none">
                {(f) => <DatePicker {...f} {...register('expiryDate')} />}
              </FormField>
            </div>
            <FormField label="Notes" error={errors.notes?.message}>
              {(f) => <Textarea {...f} {...register('notes')} />}
            </FormField>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-text">File (max 10 MB)</span>
              <FileUpload value={file} onChange={setFile} accept=".pdf,.png,.jpg,.jpeg" />
            </div>
          </CardBody>
          <CardFooter>
            <Button type="button" variant="secondary" onClick={() => navigate('/documents')}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Upload
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
