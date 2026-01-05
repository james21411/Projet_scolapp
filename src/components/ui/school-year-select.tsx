"use client";

import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SchoolYearSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  availableYears: string[];
  currentSchoolYear: string;
  placeholder?: string;
  className?: string;
}

export function SchoolYearSelect({
  value,
  onValueChange,
  availableYears,
  currentSchoolYear,
  placeholder = "Sélectionner l'année scolaire...",
  className
}: SchoolYearSelectProps) {
  const [open, setOpen] = useState(false);
  const [customYear, setCustomYear] = useState('');
  const [localValue, setLocalValue] = useState(value);

  // Synchroniser la valeur locale avec la prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const validateYearFormat = (year: string): boolean => {
    const yearPattern = /^\d{4}-\d{4}$/;
    if (!yearPattern.test(year)) return false;
    
    const [startYear, endYear] = year.split('-').map(Number);
    return endYear === startYear + 1;
  };

  const handleCustomYearSubmit = () => {
    if (validateYearFormat(customYear)) {
      // Mettre à jour la valeur locale immédiatement
      setLocalValue(customYear);
      // Appeler la fonction de changement du parent
      onValueChange(customYear);
      setCustomYear('');
      setOpen(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomYearSubmit();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {localValue || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Rechercher une année..." />
          <CommandList>
            <CommandEmpty>
              <div className="p-2">
                <div className="text-sm text-muted-foreground mb-2">
                  Aucune année trouvée. Ajouter une année personnalisée :
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Format: 2024-2025"
                    value={customYear}
                    onChange={(e) => setCustomYear(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button 
                    size="sm" 
                    onClick={handleCustomYearSubmit}
                    disabled={!validateYearFormat(customYear)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter
                  </Button>
                </div>
                {customYear && !validateYearFormat(customYear) && (
                  <p className="text-xs text-red-500 mt-1">
                    Format invalide. Utilisez le format YYYY-YYYY (ex: 2024-2025)
                  </p>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {availableYears && availableYears.length > 0 ? (
                availableYears.map((year) => (
                  <CommandItem
                    key={year}
                    value={year}
                    onSelect={() => {
                      setLocalValue(year);
                      onValueChange(year);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        localValue === year ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {year} {year === currentSchoolYear ? '(En cours)' : ''}
                  </CommandItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground">
                  Aucune année scolaire disponible
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
        
        {/* Section pour ajouter une année personnalisée */}
        <div className="p-4 border-t">
          <Label className="text-sm font-medium">Ajouter une année personnalisée</Label>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Format: 2024-2025"
              value={customYear}
              onChange={(e) => setCustomYear(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button 
              size="sm" 
              onClick={handleCustomYearSubmit}
              disabled={!validateYearFormat(customYear)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </div>
          {customYear && !validateYearFormat(customYear) && (
            <p className="text-xs text-red-500 mt-1">
              Format invalide. Utilisez le format YYYY-YYYY (ex: 2024-2025)
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
} 