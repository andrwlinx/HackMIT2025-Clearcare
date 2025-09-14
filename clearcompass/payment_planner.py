import gradio as gr
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
import json

class PaymentPlanner:
    def __init__(self):
        # Federal Poverty Level guidelines for 2024
        self.fpl_guidelines = {
            1: 15060,
            2: 20440,
            3: 25820,
            4: 31200,
            5: 36580,
            6: 41960,
            7: 47340,
            8: 52720
        }
        
        # Hardcoded financial aid programs
        self.aid_programs = [
            {
                "name": "Hospital Charity Care",
                "type": "hospital",
                "income_limit_fpl": 200,
                "coverage": "100% if under 150% FPL, sliding scale 150-200%",
                "requirements": ["Tax returns", "Pay stubs", "Bank statements"],
                "application_url": "Contact hospital financial counselor"
            },
            {
                "name": "Massachusetts Health Safety Net",
                "type": "state",
                "income_limit_fpl": 300,
                "coverage": "Sliding scale based on income",
                "requirements": ["Proof of MA residency", "Income verification"],
                "application_url": "https://www.mass.gov/health-safety-net"
            },
            {
                "name": "Patient Advocate Foundation",
                "type": "nonprofit",
                "income_limit_fpl": 400,
                "coverage": "Case-by-case assistance",
                "requirements": ["Medical bills", "Financial hardship documentation"],
                "application_url": "https://www.patientadvocate.org"
            },
            {
                "name": "Medicaid Emergency Services",
                "type": "government",
                "income_limit_fpl": 138,
                "coverage": "Emergency medical services",
                "requirements": ["Emergency medical situation", "Income verification"],
                "application_url": "https://www.mass.gov/medicaid"
            },
            {
                "name": "CareCredit Medical Financing",
                "type": "financing",
                "income_limit_fpl": 999,  # Credit-based, not income-based
                "coverage": "0% APR promotional periods available",
                "requirements": ["Credit check", "Minimum credit score"],
                "application_url": "https://www.carecredit.com"
            }
        ]
        
        # Hospital payment plan options
        self.hospital_plans = {
            "Boston Medical Center": {
                "interest_free_months": 12,
                "extended_plan_months": 24,
                "extended_plan_apr": 0.05,
                "minimum_monthly": 50
            },
            "Mass General Hospital": {
                "interest_free_months": 6,
                "extended_plan_months": 36,
                "extended_plan_apr": 0.03,
                "minimum_monthly": 100
            },
            "Brigham Surgery Center": {
                "interest_free_months": 18,
                "extended_plan_months": 24,
                "extended_plan_apr": 0.04,
                "minimum_monthly": 75
            }
        }

    def calculate_fpl_percentage(self, annual_income: float, family_size: int) -> float:
        """Calculate percentage of Federal Poverty Level"""
        if family_size > 8:
            # Add $5,380 for each additional family member
            fpl_amount = self.fpl_guidelines[8] + (family_size - 8) * 5380
        else:
            fpl_amount = self.fpl_guidelines.get(family_size, self.fpl_guidelines[1])
        
        return (annual_income / fpl_amount) * 100

    def assess_financial_capacity(self, annual_income: float, family_size: int, 
                                monthly_expenses: float) -> Dict:
        """Assess patient's financial capacity for medical payments"""
        monthly_income = annual_income / 12
        disposable_income = monthly_income - monthly_expenses
        
        # Conservative payment capacity (10-15% of disposable income)
        conservative_payment = max(25, disposable_income * 0.10)
        moderate_payment = max(50, disposable_income * 0.15)
        aggressive_payment = max(100, disposable_income * 0.25)
        
        return {
            "monthly_income": monthly_income,
            "disposable_income": disposable_income,
            "conservative_payment": conservative_payment,
            "moderate_payment": moderate_payment,
            "aggressive_payment": aggressive_payment
        }

    def generate_payment_plans(self, total_cost: float, hospital: str, 
                             financial_capacity: Dict) -> List[Dict]:
        """Generate optimized payment plan options"""
        plans = []
        hospital_options = self.hospital_plans.get(hospital, self.hospital_plans["Boston Medical Center"])
        
        # Plan 1: Interest-free hospital plan
        if total_cost > 0:
            monthly_payment_1 = total_cost / hospital_options["interest_free_months"]
            if monthly_payment_1 >= hospital_options["minimum_monthly"]:
                plans.append({
                    "name": f"{hospital_options['interest_free_months']}-Month Interest-Free Plan",
                    "monthly_payment": round(monthly_payment_1, 2),
                    "total_months": hospital_options["interest_free_months"],
                    "total_cost": total_cost,
                    "interest_rate": 0,
                    "provider": hospital,
                    "recommendation": "Best option - no interest charges"
                })
        
        # Plan 2: Extended hospital plan with low interest
        monthly_payment_2 = total_cost / hospital_options["extended_plan_months"]
        if monthly_payment_2 >= hospital_options["minimum_monthly"]:
            total_with_interest = total_cost * (1 + hospital_options["extended_plan_apr"] * 
                                              hospital_options["extended_plan_months"] / 12)
            plans.append({
                "name": f"{hospital_options['extended_plan_months']}-Month Extended Plan",
                "monthly_payment": round(total_with_interest / hospital_options["extended_plan_months"], 2),
                "total_months": hospital_options["extended_plan_months"],
                "total_cost": round(total_with_interest, 2),
                "interest_rate": hospital_options["extended_plan_apr"],
                "provider": hospital,
                "recommendation": "Lower monthly payments with minimal interest"
            })
        
        # Plan 3: Capacity-based custom plan
        target_payment = financial_capacity["moderate_payment"]
        if target_payment > 0:
            months_needed = int(np.ceil(total_cost / target_payment))
            plans.append({
                "name": "Income-Based Custom Plan",
                "monthly_payment": round(target_payment, 2),
                "total_months": months_needed,
                "total_cost": total_cost,
                "interest_rate": 0,
                "provider": "Custom",
                "recommendation": f"Based on {int(target_payment/financial_capacity['disposable_income']*100)}% of disposable income"
            })
        
        return plans

    def match_financial_aid(self, annual_income: float, family_size: int, 
                          total_cost: float) -> List[Dict]:
        """Match patient with eligible financial aid programs"""
        fpl_percentage = self.calculate_fpl_percentage(annual_income, family_size)
        eligible_programs = []
        
        for program in self.aid_programs:
            if fpl_percentage <= program["income_limit_fpl"]:
                # Calculate potential savings
                if program["name"] == "Hospital Charity Care":
                    if fpl_percentage <= 150:
                        savings = total_cost  # 100% coverage
                    else:
                        # Sliding scale 150-200%
                        discount_rate = 1 - ((fpl_percentage - 150) / 50 * 0.5)
                        savings = total_cost * discount_rate
                elif program["name"] == "Massachusetts Health Safety Net":
                    # Sliding scale based on income
                    discount_rate = max(0.3, 1 - (fpl_percentage / 300))
                    savings = total_cost * discount_rate
                else:
                    # Conservative estimate for other programs
                    savings = min(total_cost * 0.5, 5000)
                
                eligible_programs.append({
                    **program,
                    "estimated_savings": round(savings, 2),
                    "fpl_percentage": round(fpl_percentage, 1),
                    "priority": "High" if fpl_percentage <= 200 else "Medium"
                })
        
        return sorted(eligible_programs, key=lambda x: x["estimated_savings"], reverse=True)

    def create_comprehensive_plan(self, hospital: str, procedure_cost: float, 
                                insurance_type: str, annual_salary: float, 
                                family_members: int, monthly_expenses: float) -> Tuple[str, str, str]:
        """Main function to create comprehensive payment and aid plan"""
        
        # Calculate financial capacity
        financial_capacity = self.assess_financial_capacity(annual_salary, family_members, monthly_expenses)
        
        # Generate payment plans
        payment_plans = self.generate_payment_plans(procedure_cost, hospital, financial_capacity)
        
        # Match financial aid programs
        aid_programs = self.match_financial_aid(annual_salary, family_members, procedure_cost)
        
        # Format payment plans output
        payment_output = "## 💳 Recommended Payment Plans\n\n"
        for i, plan in enumerate(payment_plans, 1):
            payment_output += f"### Plan {i}: {plan['name']}\n"
            payment_output += f"- **Monthly Payment:** ${plan['monthly_payment']:,.2f}\n"
            payment_output += f"- **Duration:** {plan['total_months']} months\n"
            payment_output += f"- **Total Cost:** ${plan['total_cost']:,.2f}\n"
            payment_output += f"- **Interest Rate:** {plan['interest_rate']:.1%}\n"
            payment_output += f"- **Provider:** {plan['provider']}\n"
            payment_output += f"- **Why this works:** {plan['recommendation']}\n\n"
        
        # Format financial aid output
        aid_output = "## 🤝 Financial Assistance Programs You May Qualify For\n\n"
        if aid_programs:
            for program in aid_programs:
                aid_output += f"### {program['name']} ({program['type'].title()})\n"
                aid_output += f"- **Potential Savings:** ${program['estimated_savings']:,.2f}\n"
                aid_output += f"- **Your Income Level:** {program['fpl_percentage']}% of Federal Poverty Level\n"
                aid_output += f"- **Coverage:** {program['coverage']}\n"
                aid_output += f"- **Priority:** {program['priority']}\n"
                aid_output += f"- **Requirements:** {', '.join(program['requirements'])}\n"
                aid_output += f"- **Apply:** {program['application_url']}\n\n"
        else:
            aid_output += "Based on your income level, you may not qualify for need-based assistance programs. Consider the payment plan options above.\n\n"
        
        # Create summary with recommendations
        fpl_percentage = self.calculate_fpl_percentage(annual_salary, family_members)
        summary = f"## 📊 Financial Summary\n\n"
        summary += f"- **Procedure Cost:** ${procedure_cost:,.2f}\n"
        summary += f"- **Hospital:** {hospital}\n"
        summary += f"- **Insurance:** {insurance_type}\n"
        summary += f"- **Annual Income:** ${annual_salary:,.2f}\n"
        summary += f"- **Family Size:** {family_members}\n"
        summary += f"- **Income Level:** {fpl_percentage:.1f}% of Federal Poverty Level\n"
        summary += f"- **Monthly Disposable Income:** ${financial_capacity['disposable_income']:,.2f}\n\n"
        
        summary += "### 🎯 Our Recommendation:\n"
        if aid_programs and aid_programs[0]['estimated_savings'] > procedure_cost * 0.5:
            summary += f"1. **Apply for {aid_programs[0]['name']}** - could save you ${aid_programs[0]['estimated_savings']:,.2f}\n"
            summary += f"2. **Use {payment_plans[0]['name']}** for any remaining balance\n"
        else:
            summary += f"1. **Choose {payment_plans[0]['name']}** - most affordable option\n"
            if aid_programs:
                summary += f"2. **Consider applying for {aid_programs[0]['name']}** for additional savings\n"
        
        return summary, payment_output, aid_output

# Create the Gradio interface
def create_gradio_interface():
    planner = PaymentPlanner()
    
    with gr.Blocks(title="ClearCompass Payment Planner", theme=gr.themes.Soft()) as interface:
        gr.Markdown("# 🏥 ClearCompass AI Payment Planner")
        gr.Markdown("Get personalized payment plans and financial aid recommendations based on your situation.")
        
        with gr.Row():
            with gr.Column():
                gr.Markdown("## 📋 Your Information")
                
                hospital = gr.Dropdown(
                    choices=["Boston Medical Center", "Mass General Hospital", "Brigham Surgery Center"],
                    label="Selected Hospital",
                    value="Boston Medical Center"
                )
                
                procedure_cost = gr.Number(
                    label="Estimated Procedure Cost ($)",
                    value=3200,
                    minimum=0
                )
                
                insurance_type = gr.Dropdown(
                    choices=["Blue Cross Blue Shield PPO", "Aetna HMO", "UnitedHealth HDHP", "Uninsured", "Other"],
                    label="Insurance Type",
                    value="Blue Cross Blue Shield PPO"
                )
                
                annual_salary = gr.Number(
                    label="Annual Household Income ($)",
                    value=50000,
                    minimum=0
                )
                
                family_members = gr.Number(
                    label="Family Size (including yourself)",
                    value=2,
                    minimum=1,
                    maximum=10
                )
                
                monthly_expenses = gr.Number(
                    label="Monthly Essential Expenses ($)",
                    value=2500,
                    minimum=0,
                    info="Rent, utilities, food, transportation, etc."
                )
                
                generate_btn = gr.Button("Generate My Payment Plan", variant="primary", size="lg")
        
        with gr.Row():
            with gr.Column():
                summary_output = gr.Markdown(label="Summary & Recommendations")
            
        with gr.Row():
            with gr.Column():
                payment_output = gr.Markdown(label="Payment Plans")
            with gr.Column():
                aid_output = gr.Markdown(label="Financial Aid Programs")
        
        generate_btn.click(
            fn=planner.create_comprehensive_plan,
            inputs=[hospital, procedure_cost, insurance_type, annual_salary, family_members, monthly_expenses],
            outputs=[summary_output, payment_output, aid_output]
        )
        
        # Add example
        gr.Markdown("""
        ## 💡 Example Scenario
        - **Hospital:** Boston Medical Center
        - **Procedure Cost:** $3,200 (Knee Arthroscopy)
        - **Insurance:** Blue Cross Blue Shield PPO
        - **Annual Income:** $45,000
        - **Family Size:** 3
        - **Monthly Expenses:** $2,800
        
        Click "Generate My Payment Plan" to see personalized recommendations!
        """)
    
    return interface

if __name__ == "__main__":
    interface = create_gradio_interface()
    interface.launch(server_name="0.0.0.0", server_port=7861, share=True)
