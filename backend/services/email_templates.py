def get_html_email_template(
    title: str,
    greeting_name: str,
    message: str,
    details: dict,
    action_url: str = None,
    action_text: str = None,
    qr_data: str = None,
    is_print: bool = False
) -> str:
    # Build details table rows
    details_html = ""
    for k, v in details.items():
        details_html += f"""
        <tr>
            <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #334155; width: 40%; text-align: left; background-color: #f8fafc;">{k}</td>
            <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; color: #0f172a; text-align: left;">{v}</td>
        </tr>
        """

    # Action button
    action_button_html = ""
    if action_url and action_text:
        # If it's a print view, don't show the generic email action button, or keep it styled
        action_button_html = f"""
        <div style="text-align: center; margin: 30px 0;" class="no-print">
            <a href="{action_url}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; font-weight: 750; text-decoration: none; border-radius: 8px; font-size: 13px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); text-transform: uppercase; letter-spacing: 0.05em;">
                {action_text}
            </a>
        </div>
        """

    # QR Code
    qr_code_html = ""
    if qr_data:
        qr_src = f"https://api.qrserver.com/v1/create-qr-code/?size=100x100&data={qr_data}"
        qr_code_html = f"""
        <div style="text-align: center; margin-top: 25px; border-top: 1px dashed #cbd5e1; padding-top: 20px;">
            <p style="font-size: 9px; color: #64748b; margin-bottom: 6px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Registry Verification QR Code</p>
            <img src="{qr_src}" alt="Verification QR Code" style="width: 100px; height: 100px; border: 2px solid #e2e8f0; padding: 4px; border-radius: 6px; background-color: #ffffff;" />
            <p style="font-size: 9px; color: #94a3b8; margin-top: 4px; font-family: 'Courier New', monospace;">Token: {qr_data}</p>
            <p style="font-size: 8px; color: #94a3b8; margin-top: 1px;">Attested secure cryptographic verification token</p>
        </div>
        """

    # Print toolbar & autostatement
    print_toolbar = ""
    print_script = ""
    if is_print:
        print_toolbar = """
        <div class="no-print" style="background: #0f172a; padding: 14px; text-align: center; font-family: sans-serif; position: sticky; top: 0; z-index: 9999; border-bottom: 2px solid #3b82f6;">
            <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 10px 24px; font-weight: bold; border-radius: 8px; cursor: pointer; font-size: 13px; margin-right: 12px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">🖨️ Print Document / Save PDF</button>
            <button onclick="window.close()" style="background: #475569; color: white; border: none; padding: 10px 24px; font-weight: bold; border-radius: 8px; cursor: pointer; font-size: 13px;">❌ Close Preview</button>
        </div>
        """
        print_script = """
        <script>
            window.onload = function() {
                // Auto trigger print after short timeout
                setTimeout(function() {
                    window.print();
                }, 500);
            };
        </script>
        """

    # Principal Official Seal SVG
    seal_svg = """
    <svg width="75" height="75" viewBox="0 0 100 100" style="display: inline-block; vertical-align: middle; margin-left: 20px;">
        <circle cx="50" cy="50" r="46" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="3,3" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="#dc2626" stroke-width="1.5" />
        <path id="sealTextPath" d="M 18,50 A 32,32 0 1,1 82,50 A 32,32 0 1,1 18,50" fill="none" />
        <text fill="#dc2626" font-size="8" font-family="'Inter', sans-serif" font-weight="bold" letter-spacing="1">
            <textPath href="#sealTextPath" startOffset="0%">PATHSHALA ERP REGISTRY • OFFICIAL SEAL •</textPath>
        </text>
        <polygon points="50,25 55,38 68,38 58,47 62,60 50,52 38,60 42,47 32,38 45,38" fill="#dc2626" />
        <text x="50" y="70" text-anchor="middle" fill="#dc2626" font-size="7" font-family="'Inter', sans-serif" font-weight="bold">PATNA CAMPUS</text>
    </svg>
    """

    # Stylized shield crest SVG for top header
    header_crest_svg = """
    <svg width="45" height="45" viewBox="0 0 100 100" style="display: inline-block; vertical-align: middle; margin-right: 12px;">
        <path d="M 50 10 L 80 25 L 80 55 C 80 75 50 90 50 90 C 50 90 20 75 20 55 L 20 25 Z" fill="#ffffff" stroke="#fbbf24" stroke-width="3" />
        <path d="M 50 15 L 75 28 L 75 53 C 75 70 50 83 50 83 C 50 83 25 70 25 53 L 25 28 Z" fill="#1e3a8a" />
        <!-- Crest Star -->
        <polygon points="50,30 53,39 62,39 55,45 57,54 50,48 43,54 45,45 38,39 47,39" fill="#fbbf24" />
        <!-- Crest Book -->
        <path d="M 38 60 Q 50 56 62 60 L 62 68 Q 50 64 38 68 Z" fill="#ffffff" />
        <path d="M 50 56 L 50 67" stroke="#1e3a8a" stroke-width="1.5" />
    </svg>
    """

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@400;600;800&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet">
    <style>
        @media print {{
            .no-print {{ display: none !important; }}
            body {{ background-color: #ffffff !important; padding: 0 !important; }}
            .card {{ border: none !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }}
            .content-wrapper {{ padding: 20px 0 !important; }}
        }}
        body {{
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            font-family: 'Inter', 'Segoe UI', Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
        }}
    </style>
</head>
<body>
    {print_toolbar}
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;" class="content-wrapper">
        <tr>
            <td align="center">
                <table width="100%" max-width="650" style="max-width: 650px; width: 100%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border-collapse: collapse;" class="card">
                    <!-- Brand Banner Header -->
                    <tr style="background-color: #1e3a8a; border-bottom: 4px solid #f59e0b;">
                        <td style="padding: 28px 30px; text-align: left; vertical-align: middle;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td width="50" style="vertical-align: middle;">
                                        {header_crest_svg}
                                    </td>
                                    <td style="vertical-align: middle; text-align: left; padding-left: 5px;">
                                        <h1 style="color: #ffffff; margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 700; letter-spacing: 0.02em; line-height: 1.2;">
                                            PATHSHALA
                                        </h1>
                                        <p style="color: #fbbf24; margin: 2px 0 0 0; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em;">
                                            Group of Institutions • Academic ERP Registry
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content Body -->
                    <tr>
                        <td style="padding: 40px 35px;">
                            <h2 style="color: #0f172a; margin-top: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; border-left: 4px solid #4f46e5; padding-left: 14px; text-align: left; line-height: 1.3;">
                                {title}
                            </h2>
                            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-top: 25px; text-align: left;">
                                Hello <strong>{greeting_name}</strong>,
                            </p>
                            <p style="color: #475569; font-size: 14px; line-height: 1.6; text-align: left; margin-bottom: 25px;">
                                {message}
                            </p>
                            
                            <!-- Information Summary Table -->
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; font-size: 13.5px;">
                                <tr style="background-color: #1e3a8a;">
                                    <th colspan="2" style="padding: 12px 14px; text-align: left; color: #ffffff; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.08em;">Official Records & Details</th>
                                </tr>
                                {details_html}
                            </table>
                            
                            {action_button_html}
                            
                            {qr_code_html}
                            
                            <!-- Official Signature Registry Section -->
                            <div style="margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 25px; text-align: left;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="vertical-align: middle; text-align: left;">
                                            <p style="font-size: 10px; color: #64748b; margin: 0 0 5px 0; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Attestation Authority</p>
                                            
                                            <!-- Cursive handwriting signature -->
                                            <p style="font-family: 'Great Vibes', 'Brush Script MT', 'Lucida Handwriting', cursive; font-size: 32px; color: #1e3a8a; margin: 5px 0 0 0; line-height: 1; font-weight: normal;">
                                                Dr. Devendra Prasad
                                            </p>
                                            
                                            <p style="font-size: 12px; color: #1e293b; margin: 6px 0 2px 0; font-weight: bold;">Dr. Devendra Prasad</p>
                                            <p style="font-size: 10px; color: #475569; margin: 0;">Principal, Pathshala Group</p>
                                            <p style="font-size: 9px; color: #94a3b8; margin: 4px 0 0 0;">ERP Secure Administrative Signature</p>
                                        </td>
                                        <td style="vertical-align: middle; text-align: right;" width="90">
                                            {seal_svg}
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer Info -->
                    <tr style="background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                        <td style="padding: 30px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6;">
                            <p style="margin: 0; font-weight: bold; color: #334155; font-size: 12px;">Pathshala Group of Institutions</p>
                            <p style="margin: 4px 0 12px 0;">Administrative Head Office, Pathshala Campus, Patna, Bihar, India</p>
                            <p style="margin: 12px 0;">
                                <a href="https://pathshala.edu.in" style="color: #4f46e5; text-decoration: none; font-weight: bold; margin: 0 8px;">🌐 Website</a> | 
                                <a href="tel:+91180012345" style="color: #4f46e5; text-decoration: none; font-weight: bold; margin: 0 8px;">📞 Support: 1800-123-45</a> |
                                <a href="mailto:info@pathshala.edu.in" style="color: #4f46e5; text-decoration: none; font-weight: bold; margin: 0 8px;">✉️ registry@pathshala.edu.in</a>
                            </p>
                            <p style="margin: 15px 0 0 0; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                                This is a secure automated electronic registry document issued by Pathshala ERP. Unauthorised modification is strictly prohibited.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    {print_script}
</body>
</html>
"""
    return html

def get_leave_email_html(applicant_name: str, leave_type: str, start_date: str, end_date: str, status: str, reason: str, is_print: bool = False) -> str:
    title = f"Official Leave Request {status}"
    message = f"Your administrative leave request has been processed. The official registry decision record is listed below:"
    details = {
        "Applicant Name": applicant_name,
        "Document Class": "Leave Verification Slip",
        "Leave Category": leave_type,
        "Start Date": start_date,
        "End Date": end_date,
        "Approval Status": status,
        "Statement/Reason": reason
    }
    qr_data = f"LEAVE-VERIFY-{status}-{applicant_name.replace(' ', '')}-{start_date}"
    return get_html_email_template(
        title=title,
        greeting_name=applicant_name,
        message=message,
        details=details,
        action_url="http://localhost:5173/leaves",
        action_text="Open Leave Portal",
        qr_data=qr_data,
        is_print=is_print
    )

def get_book_issue_email_html(student_name: str, book_title: str, due_date: str, status: str, is_print: bool = False) -> str:
    title = f"Library Checked-Out Slip: {book_title}"
    message = f"An academic resource has been officially checked out from the Pathshala central library. Please return the book by the due date to avoid standard overdue penalties."
    details = {
        "Student Borrower": student_name,
        "Document Class": "Library Issue Receipt",
        "Book Title": book_title,
        "Checkout Date": "Today",
        "Overdue Return Date": due_date,
        "Overdue Fine Rate": "Rs. 2.00 / day",
        "Registry Status": status
    }
    qr_data = f"LIB-ISSUE-{student_name.replace(' ', '')}-{due_date}"
    return get_html_email_template(
        title=title,
        greeting_name=student_name,
        message=message,
        details=details,
        action_url="http://localhost:5173/library",
        action_text="View Library Status",
        qr_data=qr_data,
        is_print=is_print
    )

def get_assignment_submit_email_html(student_name: str, assignment_title: str, subject_code: str, is_print: bool = False) -> str:
    title = f"Assignment Submission Receipt"
    message = f"Your assignment submission has been successfully uploaded and digitally signed. Your academic attendance for today has been automatically marked as PRESENT."
    details = {
        "Student Submitter": student_name,
        "Document Class": "Assignment Receipt & Attestation",
        "Work Assignment": assignment_title,
        "Subject Code": subject_code,
        "Upload Registry Date": "Just Now",
        "Attendance Status": "Attested Present"
    }
    qr_data = f"ASSIGN-{student_name.replace(' ', '')}-{subject_code}"
    return get_html_email_template(
        title=title,
        greeting_name=student_name,
        message=message,
        details=details,
        action_url="http://localhost:5173/assignments",
        action_text="Open Submissions",
        qr_data=qr_data,
        is_print=is_print
    )

def get_marks_published_email_html(student_name: str, subject_name: str, marks_obtained: float, max_marks: float, grade: str, is_print: bool = False) -> str:
    title = f"Academic Grade Sheet: {subject_name}"
    message = f"Your examination results have been officially evaluated and published in the ERP database. Below is the summary of your grades:"
    details = {
        "Student Name": student_name,
        "Document Class": "Official Marks Slip",
        "Subject / Paper": subject_name,
        "Marks Scored": f"{marks_obtained} / {max_marks}",
        "Letter Grade Card": grade,
        "Status Code": "PASS" if grade != "F" else "FAIL"
    }
    qr_data = f"MARKS-{student_name.replace(' ', '')}-{grade}"
    return get_html_email_template(
        title=title,
        greeting_name=student_name,
        message=message,
        details=details,
        action_url="http://localhost:5173/student-results",
        action_text="View Report Cards",
        qr_data=qr_data,
        is_print=is_print
    )

def get_fee_receipt_email_html(student_name: str, amount: float, payment_method: str, reference_id: str, status: str, is_print: bool = False) -> str:
    title = f"Official Transaction Receipt: {reference_id}"
    message = f"Your payment has been successfully cleared and credited to Pathshala Finance Accounts. A full receipt is detailed below."
    details = {
        "Account Holder": student_name,
        "Document Class": "Finance Settlement Slip",
        "Reference ID": reference_id,
        "Amount Settled": f"Rs. {amount:,.2f}",
        "Payment Mode": payment_method,
        "Status Indicator": status
    }
    qr_data = f"FIN-RECEIPT-{reference_id}-{amount}"
    return get_html_email_template(
        title=title,
        greeting_name=student_name,
        message=message,
        details=details,
        action_url="http://localhost:5173/student-fees",
        action_text="Open Fees Panel",
        qr_data=qr_data,
        is_print=is_print
    )

def get_attendance_report_email_html(student_name: str, month_name: str, overall_pct: float, details_dict: dict, is_print: bool = False) -> str:
    title = f"Official Attendance Slip ({month_name})"
    message = f"Your monthly academic class attendance compliance report has been generated. The verified compliance registry details are listed below:"
    
    details = {
        "Student Name": student_name,
        "Document Class": "Attendance Slip",
        "Reporting Month": month_name,
        "Combined Compliance": f"{overall_pct:.2f}%",
        "Registry Status": "COMPLIANT" if overall_pct >= 75.0 else "SHORTAGE WARNING"
    }
    # Add subject attendance to details
    for subject, rate in details_dict.items():
        details[f"Subject: {subject}"] = f"{rate}"
        
    qr_data = f"ATTEND-{student_name.replace(' ', '')}-{month_name}-{int(overall_pct)}"
    return get_html_email_template(
        title=title,
        greeting_name=student_name,
        message=message,
        details=details,
        action_url="http://localhost:5173/student-attendance",
        action_text="Open Attendance Sheet",
        qr_data=qr_data,
        is_print=is_print
    )

def get_placement_letter_email_html(student_name: str, company_name: str, designation: str, ctc_package: str, offer_date: str, is_print: bool = False) -> str:
    title = f"Campus Placement Selection Letter"
    message = f"Congratulations! You have been successfully selected in the campus placement drive. Pathshala Training and Placement Cell is proud to attest this letter of selection."
    details = {
        "Student Candidate": student_name,
        "Document Class": "Placement Selection Slip",
        "Selecting Corporate": company_name,
        "Designation Offered": designation,
        "Offered Package": ctc_package,
        "Selection Date": offer_date,
        "Attestation Status": "Attested & Verified"
    }
    qr_data = f"PLACE-{student_name.replace(' ', '')}-{company_name.replace(' ', '')}"
    return get_html_email_template(
        title=title,
        greeting_name=student_name,
        message=message,
        details=details,
        action_url="http://localhost:5173/dashboard",
        action_text="View Dashboard",
        qr_data=qr_data,
        is_print=is_print
    )

def get_semester_transcript_html(
    student_name: str,
    roll_no: str,
    course_name: str,
    semester_name: str,
    gpa: str,
    cgpa: str,
    courses: list,
    is_print: bool = False
) -> str:
    title = f"Academic Transcript: {semester_name}"
    
    courses_rows_html = ""
    for c in courses:
        courses_rows_html += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569; font-size: 12px; text-align: left;">{c['code']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 12px; text-align: left;">{c['name']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 12px; text-align: center;">{c['credits']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 12px; text-align: center; font-weight: bold;">{c['grade']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 12px; text-align: center;">{c['points']}/10</td>
        </tr>
        """
        
    message = f"""
    Please find below your verified academic transcript for <strong>{semester_name}</strong>.
    
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 15px; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
        <tr style="background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
            <th style="padding: 10px; text-align: left; color: #475569; font-size: 11px; font-weight: bold; text-transform: uppercase;">Code</th>
            <th style="padding: 10px; text-align: left; color: #475569; font-size: 11px; font-weight: bold; text-transform: uppercase;">Subject</th>
            <th style="padding: 10px; text-align: center; color: #475569; font-size: 11px; font-weight: bold; text-transform: uppercase;">Credits</th>
            <th style="padding: 10px; text-align: center; color: #475569; font-size: 11px; font-weight: bold; text-transform: uppercase;">Grade</th>
            <th style="padding: 10px; text-align: center; color: #475569; font-size: 11px; font-weight: bold; text-transform: uppercase;">Points</th>
        </tr>
        {courses_rows_html}
    </table>
    """
    
    details = {
        "Student Name": student_name,
        "Roll Number": roll_no,
        "Degree Course": course_name,
        "Academic Semester": semester_name,
        "Semester GPA": gpa,
        "Cumulative CGPA": cgpa,
        "Registry Status": "PASSED" if float(gpa) >= 4.0 else "PROBATION_WARNING"
    }
    
    qr_data = f"TRANSCRIPT-{roll_no}-{semester_name.replace(' ', '')}-{gpa}"
    
    return get_html_email_template(
        title=title,
        greeting_name=student_name,
        message=message,
        details=details,
        action_url="http://localhost:5173/student-results",
        action_text="View Results Portal",
        qr_data=qr_data,
        is_print=is_print
    )

def get_credentials_email_html(name: str, role_name: str, username: str, password: str, pathshala_email: str) -> str:
    details = {
        "Name": name,
        "Account Type / Role": role_name,
        "Login Username": username,
        "Default Password": password,
        "Official Institutional Email": pathshala_email
    }
    return get_html_email_template(
        title="Pathshala ERP - Account Credentials",
        greeting_name=name,
        message="Your official Pathshala ERP account has been successfully created. Below are your login credentials. Please log in and change your default password from the Profile Settings tab immediately.",
        details=details,
        action_url="http://localhost:5173/login",
        action_text="Log In To Portal"
    )

