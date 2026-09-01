import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterCustomerPage from "@/app/register/page";
import RegisterCompanyPage from "@/app/register/company/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("Customer Registration Page (/register)", () => {
  it("renders customer registration form fields", () => {
    render(<RegisterCustomerPage />);
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Account/i })).toBeInTheDocument();
  });

  it("validates password mismatch on customer registration", async () => {
    render(<RegisterCustomerPage />);
    
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: "Doe" } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: "john@example.com" } });
    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: "Password123!" } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: "Different123!" } });

    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });
});

describe("Seller Registration Page (/register/company)", () => {
  it("renders seller registration form fields including required phone", () => {
    render(<RegisterCompanyPage />);
    expect(screen.getByLabelText(/Business Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Business Phone/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Company Account/i })).toBeInTheDocument();
  });
});
