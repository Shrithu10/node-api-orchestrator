import { useCallback, useEffect, useRef, useState } from 'react'
import { getRunDetail } from '../api/client'
import type { RunDetail } from '../types'

const TERMINAL_STATES = new Set(['completed', 'failed'])
const POLL_INTERVAL_MS = 2500

export function useRunPoller() {
  const [runId, setRunId] = useState<string | null>(null)
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const cancelRef = useRef(false)

  const startPolling = useCallback((id: string) => {
    setRunId(id)
    setRunDetail(null)
    setIsPolling(true)
  }, [])

  const stopPolling = useCallback(() => {
    cancelRef.current = true
    setIsPolling(false)
    setRunId(null)
  }, [])

  useEffect(() => {
    if (!runId) return

    cancelRef.current = false

    const poll = async () => {
      if (cancelRef.current) return
      try {
        const detail = await getRunDetail(runId)
        if (cancelRef.current) return
        setRunDetail(detail)
        if (TERMINAL_STATES.has(detail.status)) {
          setIsPolling(false)
          return
        }
      } catch {
        if (!cancelRef.current) setIsPolling(false)
        return
      }
      if (!cancelRef.current) {
        setTimeout(poll, POLL_INTERVAL_MS)
      }
    }

    poll()

    return () => {
      cancelRef.current = true
    }
  }, [runId])

  return { runDetail, isPolling, startPolling, stopPolling }
}
