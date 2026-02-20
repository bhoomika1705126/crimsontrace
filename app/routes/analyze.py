from fastapi import APIRouter, UploadFile, File, HTTPException, Response
from fastapi.responses import JSONResponse
import pandas as pd
import io
from app.services.analyzer import analyze_csv
import traceback

router = APIRouter()

@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    try:
        # 1. Check file size (max 5MB)
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:
            return JSONResponse(
                status_code=413,
                content={"error": "File too large. Max 5MB."}
            )

        # 2. Decode and parse CSV
        try:
            csv_str = contents.decode('utf-8')
            # Quick validation: try reading with pandas
            df = pd.read_csv(io.StringIO(csv_str))
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={"error": f"CSV parsing failed: {str(e)}"}
            )

        # 3. Validate required columns
        required = ['transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp']
        missing = [col for col in required if col not in df.columns]
        if missing:
            return JSONResponse(
                status_code=400,
                content={"error": f"Missing columns: {missing}"}
            )

        # 4. Run analysis with exception handling
        try:
            result = analyze_csv(csv_str)
            return result
        except Exception as e:
            print("ERROR in analyze_csv:", str(e))
            traceback.print_exc()
            return JSONResponse(
                status_code=500,
                content={"error": f"Analysis failed: {str(e)}"}
            )

    except Exception as e:
        print("Unhandled exception:", str(e))
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )