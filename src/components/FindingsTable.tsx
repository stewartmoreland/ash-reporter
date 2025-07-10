import { useState } from 'preact/hooks'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { X } from 'lucide-preact'
import { Badge } from './ui/badge'
import { severityConfig, cn } from '../lib/utils'
import type { Finding, SeverityLevel } from '../types/ash'

interface FindingsTableProps {
  findings: Finding[]
}

export function FindingsTable({ findings }: FindingsTableProps) {
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel[]>(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])

  const filteredFindings = findings.filter(finding => {
    const matchesTab = activeTab === 'all' || finding.tool === activeTab
    const matchesSeverity = severityFilter.includes(finding.severity)
    return matchesTab && matchesSeverity
  })

  const tools = [...new Set(findings.map(f => f.tool))]

  const getSeverityVariant = (severity: SeverityLevel) => {
    switch (severity) {
      case 'CRITICAL': return 'error'
      case 'HIGH': return 'warning'
      case 'MEDIUM': return 'warning'
      case 'LOW': return 'success'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-4">
      {/* Severity Filter */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(severityConfig).map(([severity, config]) => {
          const severityKey = severity as SeverityLevel
          const isActive = severityFilter.includes(severityKey)

          return (
            <button
              key={severity}
              onClick={() => {
                setSeverityFilter(prev =>
                  prev.includes(severityKey)
                    ? prev.filter(s => s !== severityKey)
                    : [...prev, severityKey]
                )
              }}
              className={cn(
                "px-3 py-1 text-sm rounded-full border-2 transition-colors",
                isActive
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
              )}
            >
              {config.icon} {severity}
            </button>
          )
        })}
      </div>

      {/* Tool Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex space-x-1 rounded-lg bg-gray-100 p-1">
          <Tabs.Trigger
            value="all"
            className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            All Tools
          </Tabs.Trigger>
          {tools.map(tool => (
            <Tabs.Trigger
              key={tool}
              value={tool}
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              {tool}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>

      {/* Findings Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium">Severity</th>
              <th className="text-left p-4 font-medium">Tool</th>
              <th className="text-left p-4 font-medium">Message</th>
              <th className="text-left p-4 font-medium">Location</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFindings.map((finding, index) => (
              <tr key={index} className="border-t hover:bg-gray-50">
                <td className="p-4">
                  <Badge variant={getSeverityVariant(finding.severity)}>
                    {severityConfig[finding.severity].icon} {finding.severity}
                  </Badge>
                </td>
                <td className="p-4 font-mono text-sm">{finding.tool}</td>
                <td className="p-4 max-w-md truncate">{finding.message}</td>
                <td className="p-4 font-mono text-sm text-gray-600">{finding.location}</td>
                <td className="p-4">
                  <button
                    onClick={() => setSelectedFinding(finding)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredFindings.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No findings match the current filters.
          </div>
        )}
      </div>

      {/* Finding Details Modal */}
      <Dialog.Root open={!!selectedFinding} onOpenChange={() => setSelectedFinding(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold mb-4">
              Finding Details
            </Dialog.Title>

            {selectedFinding && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Severity</label>
                    <Badge variant={getSeverityVariant(selectedFinding.severity)} className="mt-1">
                      {severityConfig[selectedFinding.severity].icon} {selectedFinding.severity}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tool</label>
                    <p className="font-mono text-sm mt-1">{selectedFinding.tool}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <p className="mt-1">{selectedFinding.message}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="font-mono text-sm mt-1">{selectedFinding.location}</p>
                </div>

                {selectedFinding.lineNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Line Number</label>
                    <p className="font-mono text-sm mt-1">{selectedFinding.lineNumber}</p>
                  </div>
                )}

                {selectedFinding.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm">{selectedFinding.description}</p>
                  </div>
                )}

                {selectedFinding.recommendation && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recommendation</label>
                    <p className="mt-1 text-sm bg-blue-50 p-3 rounded border">{selectedFinding.recommendation}</p>
                  </div>
                )}

                {selectedFinding.cve && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CVE</label>
                    <p className="font-mono text-sm mt-1">{selectedFinding.cve}</p>
                  </div>
                )}
              </div>
            )}

            <Dialog.Close className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
} 