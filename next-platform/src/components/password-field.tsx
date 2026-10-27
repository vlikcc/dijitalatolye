"use client";
import { useId, useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
export function PasswordField({
  label = "Parola",
  autoComplete = "new-password",
  minLength = 12,
  showRequirementFeedback = false,
}: {
  label?: string;
  autoComplete?: string;
  minLength?: number;
  showRequirementFeedback?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [requirementMet, setRequirementMet] = useState(false);
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input">
        <input
          id={id}
          type={visible ? "text" : "password"}
          name="password"
          autoComplete={autoComplete}
          required
          minLength={minLength}
          maxLength={128}
          onInput={
            showRequirementFeedback
              ? (event) =>
                  setRequirementMet(
                    event.currentTarget.value.length >= minLength,
                  )
              : undefined
          }
          aria-describedby={minLength > 1 ? id + "-help" : undefined}
        />
        <button
          type="button"
          aria-label={visible ? "Parolayı gizle" : "Parolayı göster"}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {minLength > 1 && (
        <span
          className={
            showRequirementFeedback
              ? "form-help password-requirement"
              : "form-help"
          }
          id={id + "-help"}
          aria-live={showRequirementFeedback ? "polite" : undefined}
          data-met={
            showRequirementFeedback && requirementMet ? "true" : undefined
          }
        >
          {showRequirementFeedback && requirementMet && (
            <Check size={15} aria-hidden="true" />
          )}
          {showRequirementFeedback && requirementMet
            ? `En az ${minLength} karakter koşulu sağlandı.`
            : `En az ${minLength} karakter.`}
        </span>
      )}
    </div>
  );
}
