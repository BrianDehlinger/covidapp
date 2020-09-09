variable "vpc_cidr" { default = "10.0.0.0/16" }
variable "subnet_one_cidr" { default = ["10.0.1.0/24", "10.0.4.0/24"] }
variable "subnet_two_cidr" { default = ["10.0.2.0/24", "10.0.3.0/24"] }
variable "route_table_cidr" { default = "0.0.0.0/0" }
variable "host" {default = "aws_instance.my_web_instance.public_dns"}
variable "web_ports" { default = ["22", "80", "443", "3306"] }
variable "db_ports" { default = ["22", "3306"] }

provider "aws" {
  profile = "stoplight"
  region = "us-east-2"
}

data "aws_secretsmanager_secret_version" "creds" {
  # Fill in the name you gave to your secret
  secret_id = "covidapp/db_creds"
}

locals {
  db_creds = jsondecode(
    data.aws_secretsmanager_secret_version.creds.secret_string
  )
}

data "aws_availability_zones" "availability_zones" {}

resource "aws_vpc" "stoplight" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  tags = {
    Name = "stoplight"
  }
}

resource "aws_subnet" "stoplight_public" {
  vpc_id                  = aws_vpc.stoplight.id
  cidr_block              = element(var.subnet_one_cidr, 0)
  availability_zone       = data.aws_availability_zones.availability_zones.names[0]
  map_public_ip_on_launch = true
  tags = {
    Name = "stoplight_public"
  }
}

resource "aws_subnet" "stoplight_public_two" {
  vpc_id                  = aws_vpc.stoplight.id
  cidr_block              = element(var.subnet_one_cidr, 1)
  availability_zone       = data.aws_availability_zones.availability_zones.names[1]
  map_public_ip_on_launch = true
  tags = {
    Name = "stoplight_public_two"
  }
}

resource "aws_subnet" "stoplight_private_one" {
  vpc_id                  = aws_vpc.stoplight.id
  cidr_block              = element(var.subnet_two_cidr, 0)
  availability_zone       = data.aws_availability_zones.availability_zones.names[0]
  tags = {
    Name = "stoplight_private_one"
  }
}

resource "aws_subnet" "stoplight_private_two" {
  vpc_id                  = aws_vpc.stoplight.id
  cidr_block              = element(var.subnet_two_cidr, 1)
  availability_zone       = data.aws_availability_zones.availability_zones.names[1]
  tags = {
    Name = "stoplight_private_two"
  }
}

## create internet gateway
resource "aws_internet_gateway" "stoplight" {
  vpc_id = aws_vpc.stoplight.id
  tags=  {
    Name = "stoplight"
  }
}

## create public route table (assosiated with internet gateway)
resource "aws_route_table" "stoplight_public" {
  vpc_id = aws_vpc.stoplight.id
  route {
    cidr_block = var.route_table_cidr
    gateway_id = aws_internet_gateway.stoplight.id
  }
  tags = {
    Name = "stoplight_public"
  }
}

## create private subnet route table
resource "aws_route_table" "stoplight_private" {
  vpc_id = aws_vpc.stoplight.id
  tags = {
    Name = "stoplight_private"
  }
}

## create default route table
resource "aws_default_route_table" "stoplight" {
  default_route_table_id = aws_vpc.stoplight.default_route_table_id
  tags = {
    Name = "stoplight"
  }
}

## associate public subnets with public route table
resource "aws_route_table_association" "stoplight_public" {
  subnet_id      = aws_subnet.stoplight_public.id
  route_table_id = aws_route_table.stoplight_public.id
}

resource "aws_route_table_association" "stoplight_public_two" {
  subnet_id      = aws_subnet.stoplight_public_two.id
  route_table_id = aws_route_table.stoplight_public.id
}

## associate private subnets with private route table
resource "aws_route_table_association" "stoplight_private_one" {
  subnet_id      = aws_subnet.stoplight_private_one.id
  route_table_id = aws_route_table.stoplight_private.id
}

resource "aws_route_table_association" "stoplight_private_two" {
  subnet_id      = aws_subnet.stoplight_private_two.id
  route_table_id = aws_route_table.stoplight_private.id
}

## create security group for web
resource "aws_security_group" "stoplight_web" {
  name        = "stoplight"
  description = "Allow inbound web and ssh"
  vpc_id      = aws_vpc.stoplight.id
  tags = {
    Name = "stoplight"
  }
}

# create security group ingress rule for web
resource "aws_security_group_rule" "web_ingress" {
  count             = length(var.web_ports)
  type              = "ingress"
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  from_port         = element(var.web_ports, count.index)
  to_port           = element(var.web_ports, count.index)
  security_group_id = aws_security_group.stoplight_web.id

}
# create security group egress rule for web
resource "aws_security_group_rule" "web_egress" {
  count             = length(var.web_ports)
  type              = "egress"
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  from_port         = element(var.web_ports, count.index)
  to_port           = element(var.web_ports, count.index)
  security_group_id = aws_security_group.stoplight_web.id
}

## create security group for db
resource "aws_security_group" "stoplight_db" {
  name        = "db_security_group"
  description = "Allow inbound mysql and ssh"
  vpc_id      = aws_vpc.stoplight.id
  tags = {
    Name = "stoplight_db"
  }
}
## create security group ingress rule for db
resource "aws_security_group_rule" "db_ingress" {
  count             = length(var.db_ports)
  type              = "ingress"
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  from_port         = element(var.db_ports, count.index)
  to_port           = element(var.db_ports, count.index)
  security_group_id = aws_security_group.stoplight_db.id
}
## create security group egress rule for db
resource "aws_security_group_rule" "db_egress" {
  count             = length(var.db_ports)
  type              = "egress"
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  from_port         = element(var.db_ports, count.index)
  to_port           = element(var.db_ports, count.index)
  security_group_id = aws_security_group.stoplight_db.id
}

resource "aws_key_pair" "example" {
  key_name   = "examplekey"
  public_key = file("~/.ssh/terraform.pub")
}


## create aws rds subnet groups
resource "aws_db_subnet_group" "stoplight" {
  name       = "mydbsg"
  subnet_ids = [aws_subnet.stoplight_private_one.id, aws_subnet.stoplight_private_two.id]
  tags = {
    Name = "stoplight"
  }
}

resource "aws_db_instance" "stoplightdb" {
  storage_type         = "gp2"
  engine               = "mysql"
  engine_version       = "5.7.19"
  instance_class       = "db.t2.small"
  allocated_storage    = 5
  storage_encrypted    = false
  name                 = "covidapp"
  username             = local.db_creds.username
  password             = local.db_creds.password
  port                 = "3306"
  parameter_group_name = "default.mysql5.7"
  publicly_accessible  = false
  skip_final_snapshot  = true
  vpc_security_group_ids = [aws_security_group.stoplight_db.id]
  db_subnet_group_name   = aws_db_subnet_group.stoplight.name
  backup_window      = "03:00-06:00"
  # disable backups to create DB faster
  backup_retention_period = 0
  tags =  {
    Name = "COVIDstoplight"
  }
}

resource "aws_lb" "covidstoplight-org" {
    drop_invalid_header_fields = false
    enable_deletion_protection = false
    enable_http2               = true
    idle_timeout               = 60
    internal                   = false
    ip_address_type            = "ipv4"
    load_balancer_type         = "application"
    name                       = "covidstoplight-org"
    security_groups            = [aws_security_group.stoplight_web.id]
    subnets                    = [aws_subnet.stoplight_public.id, aws_subnet.stoplight_public_two.id]
    tags                       = {}

    timeouts {}
}

resource "aws_lb_target_group" "stoplight" {
  name = "stoplight"
  port = 80
  protocol = "HTTP"
  vpc_id = aws_vpc.stoplight.id
}

resource "aws_lb_target_group_attachment" "stoplight" {
    target_group_arn = aws_lb_target_group.stoplight.arn
    target_id        = aws_instance.stoplight.id
    port             = 80
}

resource "aws_lb_listener" "stoplight-https" {
  load_balancer_arn = aws_lb.covidstoplight-org.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = "arn:aws:acm:us-east-2:236714345101:certificate/82fc0a8f-ae8a-4de4-917e-1c29e5e43662"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.stoplight.arn
  }
}

resource "aws_lb_listener" "stoplight-http" {
  load_balancer_arn = aws_lb.covidstoplight-org.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_instance" "stoplight" {
  key_name      = aws_key_pair.example.key_name
  ami           = "ami-0806f7fe82d5b1455"
  instance_type = "t2.small"
  vpc_security_group_ids = [aws_security_group.stoplight_web.id]
  subnet_id              = aws_subnet.stoplight_public.id
  tags = {
    Name = "stoplight"
  }
  volume_tags = {
    Name = "stoplight"
  }

  connection {
    type        = "ssh"
    user        = "admin"
    private_key = file("~/.ssh/terraform")
    host        = self.public_ip
  }

  provisioner "file" {
    source      = "/Users/matter/.ssh/id_rsa"
    destination = ".ssh/id_rsa"
  }

  provisioner "file" {
    source      = "/Users/matter/.ssh/id_rsa.pub"
    destination = ".ssh/id_rsa.pub"
  }

  provisioner "file" {
    source      = "/Users/matter/.ssh/known_hosts.github"
    destination = ".ssh/known_hosts"
  }

  provisioner "remote-exec" {
    inline = [
      "sudo apt-get update",
      "sudo apt-get --assume-yes install git",
      "chmod 400 .ssh/id_rsa",
      "git clone -b deployment git@github.com:occ-data/covidapp.git",
      "sudo API_URL=\"http://${aws_lb.covidstoplight-org.dns_name}\" STOPLIGHT_DATABASE_URI=\"mysql://${aws_db_instance.stoplightdb.username}:${aws_db_instance.stoplightdb.password}@${aws_db_instance.stoplightdb.address}/${aws_db_instance.stoplightdb.name}?charset=utf8mb4\" /home/admin/covidapp/deploy/bootstrap.sh"
    ]
  }
  depends_on = [aws_db_instance.stoplightdb]
}

## output webserver and dbserver address
output "db_server_address" {
  value = aws_db_instance.stoplightdb.address
}
output "web_server_address" {
  value = aws_instance.stoplight.public_dns
}
output "load_balancer_address" {
  value = aws_lb.covidstoplight-org.dns_name
}
