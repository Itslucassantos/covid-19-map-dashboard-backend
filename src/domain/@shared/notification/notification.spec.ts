import Notification from "./notification";

describe("Notification unit tests", () => {
  it("accumulates errors and filters messages by context", () => {
    const notification = new Notification();
    expect(notification.hasErrors()).toBe(false);

    notification.addError({ context: "country", message: "name is required" });
    notification.addError({ context: "country", message: "lat is invalid" });
    notification.addError({ context: "daily-stat", message: "date is invalid" });

    expect(notification.hasErrors()).toBe(true);
    expect(notification.messages("country")).toBe(
      "country: name is required,country: lat is invalid",
    );
    expect(notification.messages()).toContain("daily-stat: date is invalid");
  });
});
