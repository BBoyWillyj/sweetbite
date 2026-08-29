'use client'

export function StepIndicator({ current }: { current: number }) {
  const steps = ['Contact', 'Pickup', 'Payment', 'Confirmation']
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-md mx-auto px-4 py-4 md:max-w-4xl">
        <p className="text-sm text-gray-600 mb-4">
          Step {current} of {steps.length}
        </p>
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index < current
                    ? 'bg-primary text-white'
                    : index === current - 1
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  index < current ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {step}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    index < current - 1 ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
