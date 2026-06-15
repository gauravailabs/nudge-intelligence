import { useState, useCallback } from 'react'
import { localGet, localSet } from './supabase'

export interface Version {
  id: string
  versionNumber: number
  label: string
  isDraft: boolean
  data: any
  savedAt: string
}

function storageKey(section: string, accountId: string) {
  return `versions_${accountId}_${section}`
}

export function useVersioning(section: string, accountId: string, initialData: any) {
  const key = storageKey(section, accountId)

  const loadVersions = (): Version[] => {
    const stored = localGet<Version>(key)
    if (stored.length === 0) {
      const v1: Version = {
        id: `${key}_v1`,
        versionNumber: 1,
        label: 'v1',
        isDraft: false,
        data: initialData,
        savedAt: new Date().toISOString(),
      }
      localSet(key, [v1])
      return [v1]
    }
    return stored
  }

  const [versions, setVersions] = useState<Version[]>(loadVersions)
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    () => {
      const vs = loadVersions()
      return vs[0]?.id ?? ''
    }
  )

  const activeVersion = versions.find(v => v.id === selectedVersionId) ?? versions[0]
  const currentData   = activeVersion?.data ?? initialData
  const hasDraft      = versions.some(v => v.isDraft)

  const saveDraft = useCallback((data: any) => {
    setVersions(prev => {
      const draftIdx = prev.findIndex(v => v.isDraft)
      let updated: Version[]
      if (draftIdx >= 0) {
        updated = prev.map((v, i) => i === draftIdx ? { ...v, data, savedAt: new Date().toISOString() } : v)
      } else {
        const draftVersion: Version = {
          id: `${key}_draft_${Date.now()}`,
          versionNumber: -1,
          label: 'Draft',
          isDraft: true,
          data,
          savedAt: new Date().toISOString(),
        }
        updated = [draftVersion, ...prev]
        setSelectedVersionId(draftVersion.id)
      }
      localSet(key, updated)
      return updated
    })
  }, [key])

  const publish = useCallback(() => {
    setVersions(prev => {
      const draftIdx = prev.findIndex(v => v.isDraft)
      if (draftIdx < 0) return prev
      const draft = prev[draftIdx]
      const maxV  = Math.max(...prev.filter(v => !v.isDraft).map(v => v.versionNumber), 0)
      const newV  = maxV + 1
      const published: Version = {
        ...draft,
        id:            `${key}_v${newV}`,
        versionNumber: newV,
        label:         `v${newV}`,
        isDraft:       false,
        savedAt:       new Date().toISOString(),
      }
      const updated = [published, ...prev.filter((_, i) => i !== draftIdx)]
      localSet(key, updated)
      setSelectedVersionId(published.id)
      return updated
    })
  }, [key])

  return {
    versions,
    activeVersion,
    currentData,
    hasDraft,
    selectedVersionId,
    setSelectedVersionId,
    saveDraft,
    publish,
  }
}
