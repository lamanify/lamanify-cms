-- Create trigger to automatically update visit payment status when payment records change
CREATE OR REPLACE TRIGGER trigger_update_visit_payment_status
    AFTER INSERT OR UPDATE OR DELETE ON public.payment_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_visit_payment_status();

-- Ensure the trigger exists and is active
COMMENT ON TRIGGER trigger_update_visit_payment_status ON public.payment_records IS 'Automatically updates patient_visits.total_paid and payment_status when payment records change';