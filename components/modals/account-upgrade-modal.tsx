"use client"

import { useState } from "react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import CloseModalButton from "@/components/ui/close-modal-button"
import { AccountType } from "@/types/enums"
import { cn } from "@/lib/utils"
import {
  ArrowUp,
  Check,
  MessageSquareShare,
  MessagesSquare,
} from "lucide-react"
import { toast } from "react-toastify"
import axios from "@/utils/axios-interceptor"
import { useOrganization } from "@/hooks/use-organization"
import { Icons } from "@/components/icons/icons"

interface AccountUpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountUpgradeModal({
  open,
  onOpenChange,
}: AccountUpgradeModalProps) {
  const { organization } = useOrganization()
  const [isLoadingBillingPortal, setIsLoadingBillingPortal] = useState(false)

  async function getBillingSession() {
    try {
      setIsLoadingBillingPortal(true)
      const subscriptionPlan = {
        accountType: organization?.accountType,
        isPro: organization?.stripeSubscriptionId ? true : false,
        stripeCustomerId: organization?.stripeCustomerId,
        stripeSubscriptionId: organization?.stripeSubscriptionId,
      }
      const session = await axios.get("/api/users/stripe", {
        params: {
          ...subscriptionPlan,
        },
      })
      setIsLoadingBillingPortal(false)

      window.open(session.data.url, "_blank")
    } catch (error) {
      setIsLoadingBillingPortal(false)
      console.error("Error occurred while fetching stripe session: ", error)
      return toast.error("Something went wrong")
    }
  }

  const plans = [
    {
      name: "Standard",
      description: "For appplications at any scale",
      price: "Min $500/month",
      priceDetail: "Per month minimum usage",
      priceColor: "text-accent-primary",
      isCurrent: false,
      features: [
        "Everything in Starter",
        "Pay-as-you-go for Data, Intelligence and Query Layer usage",
        "Real-time and application connectors",
        "Pro support",
        "Business hour response SLAs (Sev 1: 8 hours)",
      ],
    },
    {
      name: "Enterprise",
      description: "For mission-critical applications",
      price: "Custom pricing",
      priceColor: "text-accent-primary",
      isCurrent: false,
      features: [
        "Everything in Standard",
        "99.95% Uptime SLA",
        "Private Networking",
        "SOC 2, GDPR, HIPAA Compliance",
        "Enterprise support. 24/7 on-call, (Sev 1: 30 minutes)",
      ],
    },
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[600px] gap-0 space-y-0 overflow-y-auto rounded-lg p-0">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border bg-background-base p-6">
          <div className="flex flex-col gap-0.5">
            <DialogTitle className="text-left text-2xl font-bold text-foreground">
              You’ve reached your Free Tier Limit
            </DialogTitle>
            <p className="text-sm text-foreground">
              Please add a payment method to upgrade to a paid tier or contact sales.
            </p>
          </div>
        </DialogHeader>

        <div className="bg-background-solid p-6">
          <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-lg border border-border">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={cn(
                  " border-border bg-background-primary",
                  // index % 2 == 0 ? "bg-background-solid" : "bg-background-base",
                  index < 2 && "border-r"
                )}
              >
                <div className="p-4">
                  <h3 className="text-base font-bold">{plan.name}</h3>
                  <p className="mb-4 text-xs text-foreground">
                    {plan.description}
                  </p>
                  <p
                    className={`mb-4 text-sm font-bold text-accent-brand-purple`}
                  >
                    {plan.price}
                  </p>
                  {/* <p
                    className={`min-h-4 mb-4 text-xs font-medium ${"text-accent-muted"}`}
                  >
                    {plan.priceDetail}
                  </p> */}
                  {plan.isCurrent ? (
                    <Button
                      variant="outline"
                      className="h-auto w-full border border-border bg-background-primary py-1.5 px-2 text-xs font-medium text-foreground shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:bg-background-secondary"
                      disabled
                    >
                      Current
                    </Button>
                  ) : plan.name === "Standard" ? (
                    <Button
                      onClick={getBillingSession}
                      disabled={isLoadingBillingPortal}
                      className="flex h-auto w-full items-center gap-1 rounded-md bg-background-primary py-1.5 px-2 text-xs font-medium text-foreground hover:bg-background-secondary"
                    >
                      {isLoadingBillingPortal && (
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <ArrowUp className="h-4 w-4 shrink-0 text-accent-brand-purple" />
                      Add Payment Method
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="flex h-auto w-full cursor-pointer items-center justify-center gap-1 border-border bg-background-primary py-1.5 px-2 text-xs font-medium text-foreground shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:bg-background-secondary"
                      asChild
                    >
                      <a
                        href="https://www.shaped.ai/contact"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageSquareShare className="size-4 shrink-0 text-accent-brand-purple" />
                        <span className="text-xs font-medium text-foreground">
                          Talk to Sales
                        </span>
                      </a>
                    </Button>
                  )}
                </div>
                <div className="p-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-brand-purple" />
                        <span className="text-xs font-normal text-foreground">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          <div className="flex w-full items-center justify-center pt-6">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-auto cursor-pointer border border-border bg-background-primary py-1.5 px-2 text-xs font-medium text-foreground shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:bg-background-secondary"
            >
              Stay On Free Tier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
