import * as React from "react";
import { useState } from "react";
import {
  Calculator,
  Percent,
  DollarSign,
  ArrowRight,
  Info,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageContainer, PageHeader, PageContent, PageSection } from "@/components/ui/page-layout";
import { useTranslation } from "@/i18n";

// Mock model pricing
const modelPricing = [
  { id: "flux-pro", name: "Flux Pro", baseCost: 0.02, markup: 50, finalCost: 8 },
  { id: "flux-schnell", name: "Flux Schnell", baseCost: 0.008, markup: 50, finalCost: 4 },
  { id: "sdxl", name: "SDXL", baseCost: 0.012, markup: 50, finalCost: 5 },
  { id: "midjourney-v6", name: "Midjourney v6", baseCost: 0.025, markup: 50, finalCost: 10 },
  { id: "runway-gen3", name: "Runway Gen-3", baseCost: 0.10, markup: 40, finalCost: 35 },
  { id: "pika-labs", name: "Pika Labs", baseCost: 0.08, markup: 45, finalCost: 28 },
];

// Mock feature pricing
const featurePricing = [
  { id: "upscale", name: "Upscale", baseCost: 0.005, markup: 60, finalCost: 3 },
  { id: "inpaint", name: "Inpaint", baseCost: 0.01, markup: 50, finalCost: 5 },
  { id: "outpaint", name: "Outpaint", baseCost: 0.012, markup: 50, finalCost: 6 },
  { id: "relight", name: "Relight", baseCost: 0.015, markup: 45, finalCost: 7 },
];

export default function AdminPricing() {
  const { t } = useTranslation();
  const [globalMarkup, setGlobalMarkup] = useState(50);
  const [fixedFee, setFixedFee] = useState(0);
  const [useFixedFee, setUseFixedFee] = useState(false);
  const [calculatorInput, setCalculatorInput] = useState("0.02");

  const calculateFinalPrice = (baseCost: number) => {
    const marked = baseCost * (1 + globalMarkup / 100);
    const withFee = useFixedFee ? marked + fixedFee : marked;
    return Math.ceil(withFee * 100);
  };

  return (
    <PageContainer>
      <PageHeader 
        title={t.admin.pricingPlans} 
        description="Configure markup rules and pricing structure"
      >
        <Button className="gradient-brand">
          <Save className="w-4 h-4 mr-2" />
          {t.common.save}
        </Button>
      </PageHeader>

      <PageContent>

        {/* Global Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Global Markup
              </CardTitle>
              <CardDescription>Apply a base markup percentage to all provider costs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Markup Percentage</Label>
                  <span className="text-2xl font-bold gradient-text">{globalMarkup}%</span>
                </div>
                <Slider
                  value={[globalMarkup]}
                  onValueChange={(v) => setGlobalMarkup(v[0])}
                  min={0}
                  max={200}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>100%</span>
                  <span>200%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Fixed Fee
              </CardTitle>
              <CardDescription>Add a fixed fee per generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Fixed Fee</Label>
                <Switch checked={useFixedFee} onCheckedChange={setUseFixedFee} />
              </div>
              <div>
                <Label>Fee Amount ($)</Label>
                <Input
                  type="number"
                  value={fixedFee}
                  onChange={(e) => setFixedFee(parseFloat(e.target.value) || 0)}
                  step={0.01}
                  min={0}
                  disabled={!useFixedFee}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Price Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Price Calculator
            </CardTitle>
            <CardDescription>Preview final price for any provider cost</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 max-w-md">
              <div className="flex-1">
                <Label>Provider Cost ($)</Label>
                <Input
                  type="number"
                  value={calculatorInput}
                  onChange={(e) => setCalculatorInput(e.target.value)}
                  step={0.001}
                  min={0}
                  className="mt-1"
                />
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground mt-6" />
              <div className="flex-1">
                <Label>Final Price ({t.common.credits})</Label>
                <div className="mt-1 p-3 rounded-lg bg-primary/10 text-center">
                  <span className="text-2xl font-bold gradient-text">
                    {calculateFinalPrice(parseFloat(calculatorInput) || 0)}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Formula: (Provider Cost × {1 + globalMarkup/100}){useFixedFee && ` + $${fixedFee}`} → Credits (1 credit = $0.01)
            </p>
          </CardContent>
        </Card>

        <Separator />

        {/* Per-Model Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Per-Model Pricing</CardTitle>
            <CardDescription>Override markup for specific models</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.studio.model}</TableHead>
                  <TableHead className="text-right">Provider Cost</TableHead>
                  <TableHead className="text-right">Markup %</TableHead>
                  <TableHead className="text-right">Final ({t.common.credits})</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelPricing.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium">{model.name}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ${model.baseCost.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        defaultValue={model.markup}
                        className="w-20 h-8 text-right ml-auto"
                        min={0}
                        max={500}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {model.finalCost}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Custom markup overrides global setting
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Per-Feature Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Per-Feature Pricing</CardTitle>
            <CardDescription>Configure pricing for editing features</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.studio.feature}</TableHead>
                  <TableHead className="text-right">Provider Cost</TableHead>
                  <TableHead className="text-right">Markup %</TableHead>
                  <TableHead className="text-right">Final ({t.common.credits})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featurePricing.map((feature) => (
                  <TableRow key={feature.id}>
                    <TableCell className="font-medium">{feature.name}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ${feature.baseCost.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        defaultValue={feature.markup}
                        className="w-20 h-8 text-right ml-auto"
                        min={0}
                        max={500}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {feature.finalCost}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </PageContent>
    </PageContainer>
  );
}