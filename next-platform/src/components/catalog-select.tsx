"use client";

import { useState } from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

type Option = { value: string; label: string };
const ALL = "__all__";

export function CatalogSelect({
  name,
  label,
  options,
  defaultValue = "",
  value: controlledValue,
  onValueChange,
}: {
  name: string;
  label: string;
  options: Option[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(defaultValue || ALL);
  const value =
    controlledValue === undefined ? localValue : controlledValue || ALL;
  return (
    <>
      <input type="hidden" name={name} value={value === ALL ? "" : value} />
      <Select.Root
        value={value}
        onValueChange={(next) => {
          setLocalValue(next);
          onValueChange?.(next === ALL ? "" : next);
        }}
      >
        <Select.Trigger className="catalog-select-trigger" aria-label={label}>
          <Select.Value>
            {options.find((option) => (option.value || ALL) === value)?.label ??
              options[0]?.label}
          </Select.Value>
          <Select.Icon asChild>
            <ChevronDown size={17} aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className="catalog-select-menu"
            position="popper"
            sideOffset={10}
            collisionPadding={16}
            align="end"
          >
            <Select.ScrollUpButton className="catalog-select-scroll">
              <ChevronUp size={16} />
            </Select.ScrollUpButton>
            <Select.Viewport className="catalog-select-options">
              {options.map((option) => (
                <Select.Item
                  className="catalog-select-option"
                  key={option.value}
                  value={option.value || ALL}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={17} aria-hidden="true" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className="catalog-select-scroll">
              <ChevronDown size={16} />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </>
  );
}
