% =========================================================================
% --- LOADING AND DATA STRUCTURE DEFINITION ---
% =========================================================================
% Load the combined 9-row matrix 'x' from the specified .mat file
load('RareSegmentArea.mat','SegmentArea')
load('Eu3+_Tm3+Xmatrix.mat', 'x'); 
load('MeanWavelength.mat','meanv') 

% --- DYNAMIC CONFIGURATION ---
% Put row mappings into a cell array. The code will loop based on length.
ion_rows = {[2, 3, 5, 7]     ... % Ion 1 rows (e.g., Eu3+)
    [1, 4, 6, 8, 9]   ... % Ion 2 rows (e.g., Tm3+)
};

numIons = length(ion_rows)

% Push variables directly to your base workspace for debugging/validation
for ionIdx = 1:numIons
    assignin('base', sprintf('x_%d', ionIdx), x(ion_rows{ionIdx}, :));
end
% =========================================================================
MM = size (meanv,2)
% MM is the total number of peaks (9 total rows in the matrix)
NS = zeros(1, MM);
NL = zeros(1, MM);
for i = 1:MM
    NS(i) = Nx(i) .* (3 ./ (Nx(i).^2 + 2)).^2;
    NL(i) = Nx(i) .* ((Nx(i).^2 + 2) ./ 3).^2;
end 

% --- Physical Constants ---
TAGS = 2 * MM + 1; % Degeneracy configuration tracker
c = 3*10^10;       % Speed of light in cm/s
%h = 6.626*10^-30;  % Planck's constant in erg*s
h = 6.626*10^-27;  % Planck's constant in erg*s
%e = 1.5189*10^-11; % Electron charge in esu
e = 4.8032047*10^-10;

% Initialize cell containers to hold values dynamically calculated per ion
omega_cell   = cell(1, numIons);
serr_cell    = cell(1, numIons);
rms_cell     = cell(1, numIons);
qe_cell      = cell(1, numIons);
ratio_cell   = cell(1, numIons);

% Containers structured for re-building the final sequential table
SE_combined  = zeros(MM, 1);
ST_combined  = zeros(MM, 1);
RL_combined  = zeros(MM, 1);

% =========================================================================
% --- DYNAMIC LOOP CALCULATIONS OVER ALL IONS ---
% =========================================================================
for idx = 1:numIons
    % Extract the specific row index vector for the current ion loop iteration
    rows = ion_rows{idx};
    
    % Slice local data blocks cleanly
    x_local           = x(rows, :);
    SegmentArea_local = SegmentArea(rows);
    meanv_local       = meanv(rows);
    NS_local          = NS(rows);
    NL_local          = NL(rows);
   
    % 1. Experimental Line Strength Calculation
    SE_local = SegmentArea_local .* NS_local .* ((3 .* c .* h .* TAGS) ./ (8 .* pi.^3 .* e.^2 .* meanv_local)); 
    SE_combined(rows) = SE_local; % Map back to chronological list
    
    % 2. Judd-Ofelt Parameters Multivariate Fit
    omega_local = (x_local' * x_local) \ (x_local' * SE_local'); 
    omega_cell{idx} = omega_local;
    
    % 3. Theoretical Line Strength Matrix Calculation
    ST_local = (x_local * omega_local); 
    ST_combined(rows) = ST_local; % Map back to chronological list
    
    % 4. Radiative Lifetimes and Quantum Efficiencies per Branch
    EA_local = (7.2166e-10 .* NL_local) .* ST_local' ./ (TAGS .* ((meanv_local) .* .0000001) .^ 3);
    RL_local = 1000 * (1 ./ EA_local);
    RL_combined(rows) = RL_local; % Map back to chronological list
    tau_exp = 2.1
    Total_RL_local = sum(RL_local);
    qe_cell{idx} = (tau_exp / Total_RL_local) * 100;
    
    % Spectroscopy intensity ratio calculation (Omega_4 / Omega_6)
    ratio_cell{idx} = omega_local(2) / omega_local(3);
    
    % 5. Degree of Freedom Error Analytics
    DOF_local = length(rows) - 3;
    if DOF_local > 0
        SSUM_local = (sum((SE_local - ST_local') .^ 2)) / DOF_local;
        var_matrix_local = inv(x_local' * x_local);
        serr_cell{idx} = sqrt(SSUM_local .* diag(var_matrix_local)); 
        rms_cell{idx} = sqrt(SSUM_local);
    else
        serr_cell{idx} = zeros(3, 1); 
        rms_cell{idx} = 0;
    end
end

% =========================================================================
% --- UI COMPONENT UPDATING (Defaulting to first loop element array values) ---
% =========================================================================
omega1 = omega_cell{1};
set(handles.edit40,'String',num2str(omega1(1)));
set(handles.edit41,'String',num2str(omega1(2)));
set(handles.edit42,'String',num2str(omega1(3)));
set(handles.edit43,'String',num2str(qe_cell{1}));
set(handles.edit45,'String',num2str(ratio_cell{1}));

% =========================================================================
% --- EXCEL OUTPUT REPORT GENERATOR ---
% =========================================================================
% Main Table Generation

varname = {'BandSum', 'Wavelength', 'RefractiveIndex', 'U2', 'U4', 'U6', 'SExperiment', 'STheoritical', 'Lifetime'};
T1 = table(SegmentArea', (meanv)', Nx', x(1:9,1), x(1:9,2), x(1:9,3), SE_combined, ST_combined, RL_combined, 'VariableNames', varname);


outputFile = 'output.xlsx';
writetable(T1, outputFile, 'Sheet', 1, 'WriteVariableNames', true);

% Dynamic Summary Report block parsing loop
MetricsLabels = {'Judd-Ofelt Parameters Dynamic Summary Report', ''};
for idx = 1:numIons
    omega_curr = omega_cell{idx};
    serr_curr  = serr_cell{idx};
    
    ionBlock = {
        sprintf('--- ION %d PARAMETERS ---', idx), '';
        'Omega(2) =', omega_curr(1);
        'Std Omega(2) =', serr_curr(1);
        'Omega(4) =', omega_curr(2);
        'Std Omega(4) =', serr_curr(2);
        'Omega(6) =', omega_curr(3);
        'Std Omega(6) =', serr_curr(3);
        'RMS =', rms_cell{idx};
        'Quantum Efficiency (%) =', qe_cell{idx};
        'Spectroscopy Ratio (O4/O6) =', ratio_cell{idx}
    };
    MetricsLabels = [MetricsLabels; ionBlock]; %#ok<AGROW>
end

T2 = cell2table(MetricsLabels);
writetable(T2, outputFile, 'Sheet', 1, 'WriteVariableNames', false, 'Range', sprintf('A%d', size(T1,1) + 4));

disp('--- Complete Loop Execution Output Data Matrix ---');
disp(T1);

%close(Hw); 
%tEnd = toc(tStart);
%set(handles.edit10,'String',num2str(tEnd));