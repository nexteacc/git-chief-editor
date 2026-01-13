import React, { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption<T> {
  id: T;
  label: string;
  description?: string;
}

interface DropdownProps<T> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

const DropdownComponent = <T extends string>({ options, value, onChange }: DropdownProps<T>) => {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.id === value);

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="w-full px-6 py-4 rounded-xl border-2 transition-all duration-300 bg-white border-black text-black hover:bg-black hover:text-white flex items-center justify-between group outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
        >
          <span className="font-medium">{selectedOption?.label || 'Select an option'}</span>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <AnimatePresence>
          {open && (
            <DropdownMenu.Content
              forceMount
              side="bottom"
              sideOffset={8}
              collisionPadding={16}
              align="start"
              className="z-[9999]"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="min-w-[12rem] w-[var(--radix-dropdown-menu-trigger-width)] rounded-xl border-2 overflow-hidden shadow-2xl bg-white border-black"
                style={{ width: 'var(--radix-dropdown-menu-trigger-width)' }}
              >
                {/* 
                  Note: --radix-dropdown-menu-trigger-width is not automatically available in DropdownMenu (it is in Select).
                  However, we can achieve similar results or responsive width. 
                  Since we want to match the trigger width, we can rely on standard min-width or passed props.
                  For this specific use case (Language Selection), a fixed min-width is usually fine, 
                  but to be safe I'll use a reasonable min-width and max-width.
                */}
                {options.map((option, index) => (
                  <DropdownMenu.Item
                    key={String(option.id)}
                    onSelect={() => onChange(option.id)}
                    asChild
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`w-full px-6 py-4 text-left transition-colors duration-200 hover:bg-black hover:text-white focus:bg-black focus:text-white text-black flex items-center justify-between group cursor-pointer outline-none ${index !== options.length - 1 ? 'border-b border-gray-200' : ''
                        }`}
                    >
                      <div>
                        <div className="font-medium">{option.label}</div>
                        {option.description && (
                          <div className="text-sm text-gray-600 group-hover:text-gray-400 group-focus:text-gray-400">
                            {option.description}
                          </div>
                        )}
                      </div>
                      {value === option.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <Check className="w-5 h-5" />
                        </motion.div>
                      )}
                    </motion.div>
                  </DropdownMenu.Item>
                ))}
              </motion.div>
            </DropdownMenu.Content>
          )}
        </AnimatePresence>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default DropdownComponent;
