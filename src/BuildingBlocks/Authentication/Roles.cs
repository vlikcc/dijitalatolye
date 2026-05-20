namespace DijitalAtolye.BuildingBlocks.Authentication;

public static class Roles
{
    public const string Student = "Student";
    public const string Teacher = "Teacher";
    public const string Editor = "Editor";
    public const string Admin = "Admin";
    public const string SuperAdmin = "SuperAdmin";
}

public static class Policies
{
    public const string TeacherOrAbove = "TeacherOrAbove";
    public const string EditorOrAbove = "EditorOrAbove";
    public const string AdminOnly = "AdminOnly";
    public const string RequireTwoFactorForAdmin = "RequireTwoFactorForAdmin";
}
