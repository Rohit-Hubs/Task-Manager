from rest_framework import serializers
from .models import User, Project, Task
from django.utils import timezone
import re


# ─── USER SERIALIZER (with validations) ──────────────────
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email', 'role']
        extra_kwargs = {
            'password': {'write_only': True, 'min_length': 6},
            'username': {'min_length': 3, 'max_length': 30},
            'email': {'required': True},
        }

    def validate_username(self, value):
        """Username must be alphanumeric and unique."""
        if not value.isalnum():
            raise serializers.ValidationError("Username must contain only letters and numbers.")
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value.lower()

    def validate_role(self, value):
        """Role must be either 'admin' or 'member'."""
        if value not in ['admin', 'member']:
            raise serializers.ValidationError("Role must be 'admin' or 'member'.")
        return value

    def validate_email(self, value):
        """Validate email format if provided."""
        if value:
            email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_regex, value):
                raise serializers.ValidationError("Enter a valid email address.")
            if User.objects.filter(email__iexact=value).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        return value.lower() if value else value

    def validate_password(self, value):
        """Password strength validation."""
        if len(value) < 6:
            raise serializers.ValidationError("Password must be at least 6 characters long.")
        if value.isdigit():
            raise serializers.ValidationError("Password cannot be entirely numeric.")
        if value.isalpha():
            raise serializers.ValidationError("Password must contain at least one number.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


# ─── PROJECT SERIALIZER (with validations) ───────────────
class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'
        extra_kwargs = {
            'created_by': {'required': True},
        }

    def validate_name(self, value):
        """Project name must not be empty and max 100 chars."""
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Project name cannot be empty.")
        if len(value) > 100:
            raise serializers.ValidationError("Project name cannot exceed 100 characters.")
        if len(value) < 2:
            raise serializers.ValidationError("Project name must be at least 2 characters.")
        return value

    def validate(self, data):
        """Check for duplicate project names by same creator (on create only)."""
        if not self.instance:  # Only on create
            name = data.get('name', '').strip()
            created_by = data.get('created_by')
            if Project.objects.filter(name__iexact=name, created_by=created_by).exists():
                raise serializers.ValidationError({
                    "name": "You already have a project with this name."
                })
        return data


# ─── TASK SERIALIZER (with validations) ──────────────────
class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

    def validate_title(self, value):
        """Task title must not be empty."""
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Task title cannot be empty.")
        if len(value) > 200:
            raise serializers.ValidationError("Task title cannot exceed 200 characters.")
        if len(value) < 3:
            raise serializers.ValidationError("Task title must be at least 3 characters.")
        return value

    def validate_status(self, value):
        """Status must be one of the allowed choices."""
        allowed = ['pending', 'in_progress', 'done']
        if value not in allowed:
            raise serializers.ValidationError(
                f"Invalid status '{value}'. Must be one of: {', '.join(allowed)}"
            )
        return value

    def validate_priority(self, value):
        """Priority must be one of the allowed choices."""
        allowed = ['low', 'medium', 'high']
        if value not in allowed:
            raise serializers.ValidationError(
                f"Invalid priority '{value}'. Must be one of: {', '.join(allowed)}"
            )
        return value

    def validate_due_date(self, value):
        """Due date cannot be in the past for new tasks."""
        if not self.instance and value < timezone.now().date():
            raise serializers.ValidationError("Due date cannot be in the past.")
        return value

    def validate(self, data):
        """Cross-field validations and relationship integrity checks."""
        # Validate assigned_to exists
        assigned_to = data.get('assigned_to')
        if assigned_to and not User.objects.filter(id=assigned_to.id).exists():
            raise serializers.ValidationError({
                "assigned_to": "Selected user does not exist."
            })

        # Validate project exists
        project = data.get('project')
        if project and not Project.objects.filter(id=project.id).exists():
            raise serializers.ValidationError({
                "project": "Selected project does not exist."
            })

        # Prevent duplicate task titles within the same project (on create)
        if not self.instance:
            title = data.get('title', '').strip()
            if project and title:
                if Task.objects.filter(title__iexact=title, project=project).exists():
                    raise serializers.ValidationError({
                        "title": "A task with this title already exists in this project."
                    })

        # Validate status transition logic (on update)
        if self.instance and 'status' in data:
            old_status = self.instance.status
            new_status = data['status']
            # Cannot go from 'done' back to 'pending' directly
            if old_status == 'done' and new_status == 'pending':
                raise serializers.ValidationError({
                    "status": "Cannot revert a completed task directly to pending. Set to 'in_progress' first."
                })

        return data