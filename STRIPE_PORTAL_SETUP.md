# Stripe Customer Portal Setup for LamaniHub

This guide shows how to configure the Stripe Customer Portal for LamaniHub's billing page.

## Customer Portal Configuration

The Customer Portal allows clinic owners to:
- Update payment methods
- View billing history and invoices
- Download receipts
- Cancel subscriptions (if not comp'd)
- Update billing details

## Setup Steps

### 1. Configure Portal in Stripe Dashboard

1. **Go to Stripe Dashboard** > Settings > Billing > Customer Portal

2. **Business Information**:
   - Business name: `LamaniHub`
   - Support email: `support@lamanify.com`
   - Support phone: `+60 12-345 6789`
   - Terms of service: `https://lamanify.com/terms`
   - Privacy policy: `https://lamanify.com/privacy`

3. **Functionality Settings**:
   - ✅ Payment method update: **Enabled**
   - ✅ Invoice history: **Enabled** 
   - ✅ Subscription cancellation: **Enabled** ("At period end")
   - ❌ Subscription pausing: **Disabled**
   - ❌ Subscription changes: **Disabled** (single plan)

4. **Appearance**:
   - Default return URL: `https://your-domain.com/billing`
   - Color scheme: Match LamaniHub branding
   - Logo: Upload LamaniHub logo

### 2. API Integration

The portal session API (`/api/stripe/create-portal-session`) handles:

```typescript
// Key features:
- Validates tenant access
- Creates portal session with custom configuration
- Prevents comp'd users from canceling
- Returns session URL for redirect
```

### 3. Portal Features for Clinic Owners

**Payment Methods**:
- Add/remove credit cards
- Update billing address
- Set default payment method

**Billing History**:
- View all past invoices
- Download PDFs and receipts
- See payment dates and amounts

**Subscription Management**:
- View current plan details
- Cancel subscription (end of period)
- Reactivate canceled subscriptions

**Billing Details**:
- Update company information
- Change tax ID/registration details
- Modify contact information

### 4. Security & Access Control

**Permission Checks**:
- Only `admin` and `super_admin` roles can access
- Validates tenant ownership
- Secure API endpoint with service role

**Comp'd Account Handling**:
- Comp'd users can switch to self-pay
- Cannot cancel comp'd subscriptions
- Clear indication of comp'd status

### 5. User Experience Flow

1. **Clinic owner clicks "Manage Billing"**
2. **API creates portal session** with tenant's Stripe customer ID
3. **Redirect to Stripe Customer Portal** (new tab/window)
4. **Customer manages billing** in Stripe's secure interface
5. **Return to LamaniHub billing page** when done

### 6. Webhook Integration

Portal changes trigger webhooks that update LamaniHub:
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Business Benefits for Lamanify

### **Revenue Protection**
- **Self-Service Billing**: Reduces support workload
- **Failed Payment Recovery**: Direct payment method updates
- **Transparent Billing**: Builds trust with clinic owners

### **Customer Experience**
- **Professional Portal**: Stripe's polished interface
- **Complete Control**: Full billing management capability
- **Instant Updates**: Real-time sync with LamaniHub

### **Operational Efficiency**
- **Automated Billing**: No manual invoice management
- **Secure Payments**: PCI compliance handled by Stripe
- **Global Standards**: Enterprise-grade billing system

## Testing Checklist

- ✅ Portal opens from billing page
- ✅ Payment methods can be updated
- ✅ Invoices are viewable and downloadable
- ✅ Subscription can be canceled (non-comp'd)
- ✅ Billing address updates work
- ✅ Portal redirects back to LamaniHub
- ✅ Webhook events update tenant status
- ✅ Comp'd accounts have limited options
- ✅ Permission restrictions enforced

## Troubleshooting

**Portal won't open**:
- Check Stripe customer ID exists
- Verify API keys are correct
- Confirm tenant has active subscription

**Changes not reflecting**:
- Check webhook endpoint is configured
- Verify webhook events are processing
- Confirm database updates are occurring

**Access denied**:
- Verify user has `admin` or `super_admin` role
- Check tenant ownership
- Confirm user is authenticated

## Revenue Impact

This portal directly supports your **RM100k+ monthly revenue goal** by:

1. **Reducing Churn**: Easy payment method updates prevent failed payments
2. **Building Trust**: Professional billing experience increases retention
3. **Scaling Support**: Self-service reduces manual billing support
4. **Compliance**: Enterprise-grade security for healthcare clients

Every clinic owner can now manage their subscription independently, reducing friction and improving their experience with LamaniHub.