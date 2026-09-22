// app/api/webhook/whatsapp/business/registration/index.js
import { handleStep1And2 } from './step1_2';
import { handleStep3And4 } from './step3_4';
import { handleStep5And6 } from './step5_6';
import { handleStep7And8 } from './step7_8';

export async function handleRegistrationSteps(params) {
    if (await handleStep1And2(params)) return;
    if (await handleStep3And4(params)) return;
    if (await handleStep5And6(params)) return;
    if (await handleStep7And8(params)) return;
}