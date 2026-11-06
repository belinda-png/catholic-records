import React from "react";
import { BookOpenIcon, CrossIcon, DropletsIcon, HandHeartIcon, HeartIcon, BoxIcon } from "lucide-react";
import { SacramentType } from "../types/records";
const icons: Record<SacramentType, BoxIcon> = {
  baptism: DropletsIcon,
  conversion: HandHeartIcon,
  communion: BookOpenIcon,
  confirmation: CrossIcon,
  matrimony: HeartIcon
};
interface SacramentIconProps {
  type: SacramentType;
  className?: string;
}
export function SacramentIcon({
  type,
  className = 'h-4 w-4'
}: SacramentIconProps) {
  const Icon = icons[type];
  return <Icon className={className} aria-hidden="true" />;
}