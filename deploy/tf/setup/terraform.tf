terraform {
  backend "s3" {
    # Replace this with your bucket name!
    bucket         = "occ-data-terraform-state"
    key            = "global/s3/covidapp-s3-backend-terraform.tfstate"
    region         = "us-east-2"   
    dynamodb_table = "occ-data-terraform-state-locks"
    encrypt        = true
  }
}
