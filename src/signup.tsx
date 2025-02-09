import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./signup.scss";
import validation from "./signupValidation";
import axios from "axios";

const Signup: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>(""); // New state for confirmation password
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [successMessage, setSuccessMessage] = useState<string>(""); // State for success message

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfirmPassword(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formValues = { name, email, password, confirmPassword };
    const validationErrors = validation(formValues);
    setErrors(validationErrors);

    if (
      !validationErrors.name &&
      !validationErrors.email &&
      !validationErrors.password &&
      !validationErrors.confirmPassword
    ) {
      axios
        .post("http://localhost:8081/signup", formValues)
        .then((response) => {
          setSuccessMessage("You have successfully signed up!"); // Display success message
          setName("");
          setEmail("");
          setPassword("");
          setConfirmPassword("");
        })
        .catch((error) => {
          console.error("There was an error!", error);
        });
    }
  };

  return (
    <div className="signup__body">
      <div className="signup__form">
        <h2>Sign up</h2>
        <div className="signup__container">
          {successMessage && (
            <div className="signup__success-message">{successMessage}</div> // Display success message
          )}
          <form onSubmit={handleSubmit}>
            <div className="signup__form-group">
              <label htmlFor="name" className="signup__label">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={handleNameChange}
                placeholder="Enter Name"
                className="signup__form-control"
              />
              {errors.name && (
                <span className="signup__text-danger">{errors.name}</span>
              )}
            </div>

            <div className="signup__form-group">
              <label htmlFor="email" className="signup__label">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter Email"
                className="signup__form-control"
              />
              {errors.email && (
                <span className="signup__text-danger">{errors.email}</span>
              )}
            </div>

            <div className="signup__form-group">
              <label htmlFor="password" className="signup__label">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter Password"
                className="signup__form-control"
              />
              {errors.password && (
                <span className="signup__text-danger">{errors.password}</span>
              )}
            </div>

            <div className="signup__form-group">
              <label htmlFor="confirmPassword" className="signup__label">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm Password"
                className="signup__form-control"
              />
              {errors.confirmPassword && (
                <span className="signup__text-danger">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            <div className="signup__buttons-container">
              <button
                type="submit"
                className="signup__btn signup__btn--success"
              >
                Sign up
              </button>
              <Link to="/" className="signup__button">
                Log in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
