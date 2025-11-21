import React from 'react'
import { Info } from 'lucide-react'

const DemoAccountBanner = () => {
  return (
    <div className="bg-gradient-to-r from-[var(--color-primary-light)]/50 to-[var(--color-primary-light)]/30 border border-[var(--color-primary-light)] rounded-lg p-6 mb-6">
      <div className="flex items-start space-x-3">
        <Info className="h-5 w-5 text-[var(--color-primary-teal)] mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
            Demo Platform Access
          </h3>
          <p className="text-[var(--color-text-secondary)] text-sm mb-3">
            Use the demo accounts below to explore different user roles and their customizable dashboards with comprehensive African healthcare data.
          </p>
          <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
            <p><strong>Password for all accounts:</strong> demo123456</p>
            <p>Each role has different default modules and access levels.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DemoAccountBanner