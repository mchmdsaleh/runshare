const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Review" },
  { id: 3, label: "Export" }
];

export default function Stepper({ currentStep }) {
  return (
    <div className="stepper panel" role="list" aria-label="Workflow steps">
      {STEPS.map((step) => (
        <div
          key={step.id}
          role="listitem"
          className={`step ${currentStep >= step.id ? "active" : ""}`}
          aria-current={currentStep === step.id ? "step" : undefined}
        >
          {step.id}. {step.label}
        </div>
      ))}
    </div>
  );
}
