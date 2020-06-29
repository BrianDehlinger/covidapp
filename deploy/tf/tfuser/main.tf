provider "aws" {
  profile = "covid19"
  region = "us-east-2"
}

data "aws_iam_policy_document" "stoplight" {
  statement {
    actions = [
      "ec2:*",
    ]

    resources = ["*"]
    condition {
      test = "StringEquals"
      variable = "ec2:Region"

      values = ["us-east-2"]
    }
  }

  statement {
    actions = ["rds:*"]
    resources = ["arn:aws:rds:us-east-2:*:*"]
  }

  statement {
    actions = ["rds:Describe"]
    resources = ["*"]
  }

  statement {
    actions = ["elasticloadbalancing:*"]
    resources = ["*"]
  }
}

resource "aws_iam_user_policy" "stoplight" {
  name = "stoplight"
  user = aws_iam_user.stoplight.name

  policy = data.aws_iam_policy_document.stoplight.json
}

resource "aws_iam_user" "stoplight" {
  name = "stoplight"
}

resource "aws_iam_access_key" "stoplight" {
  user = aws_iam_user.stoplight.name
}

output "key_fingerprint" {
  value = aws_iam_access_key.stoplight.key_fingerprint
}

output "secret" {
  value = aws_iam_access_key.stoplight.secret
}
