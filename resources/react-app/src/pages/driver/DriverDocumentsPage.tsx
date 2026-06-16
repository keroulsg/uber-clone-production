import { useState } from 'react'
import {
  FileText, CheckCircle, XCircle, Clock, Upload,
} from 'lucide-react'
import { useDriverProfile, useUploadDriverDocument, useSubmitDriverVerification } from '@/hooks/useDrivers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/common/FileUpload'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'

type DocKey = 'license_front' | 'license_back' | 'identity_front' | 'identity_back' | 'criminal_record'

interface DocField {
  key: DocKey
  label: string
  accept: string
  imageField: keyof import('@/types').Driver
}

const docFields: DocField[] = [
  { key: 'license_front', label: 'Driver License (Front)', accept: 'image/*', imageField: 'licenseFrontImage' },
  { key: 'license_back', label: 'Driver License (Back)', accept: 'image/*', imageField: 'licenseBackImage' },
  { key: 'identity_front', label: 'ID Card (Front)', accept: 'image/*,application/pdf', imageField: 'identityFrontImage' },
  { key: 'identity_back', label: 'ID Card (Back)', accept: 'image/*,application/pdf', imageField: 'identityBackImage' },
  { key: 'criminal_record', label: 'Criminal Record', accept: 'application/pdf', imageField: 'criminalRecord' },
]

export default function DriverDocumentsPage() {
  const { data: driver, isLoading, error, refetch } = useDriverProfile()
  const uploadDocument = useUploadDriverDocument()
  const submitVerification = useSubmitDriverVerification()

  const handleUpload = (key: DocKey, file: File) => {
    uploadDocument.mutate({ type: key, file })
  }

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Upload your documents for verification"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Required Documents</CardTitle>
              <CardDescription>All documents must be clear and legible</CardDescription>
            </div>
            <Badge variant={driver?.isVerified ? 'success' : 'warning'}>
              {driver?.isVerified ? 'Verified' : 'Pending'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {docFields.map((doc) => {
            const uploadedUrl = driver?.[doc.imageField] as string | undefined
            return (
              <div key={doc.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{doc.label}</span>
                  </div>
                  {uploadedUrl ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Uploaded</Badge>
                      <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">View</Button>
                      </a>
                    </div>
                  ) : (
                    <Badge variant="secondary">Not uploaded</Badge>
                  )}
                </div>
                {!uploadedUrl && (
                  <FileUpload
                    accept={doc.accept}
                    maxSize={5 * 1024 * 1024}
                    onUpload={(file) => handleUpload(doc.key, file)}
                    disabled={uploadDocument.isPending}
                  />
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          className="gap-2"
          onClick={() => submitVerification.mutate()}
          disabled={submitVerification.isPending}
        >
          <Upload className="h-4 w-4" />
          {submitVerification.isPending ? 'Submitting...' : 'Submit for Verification'}
        </Button>
      </div>
    </div>
  )
}
